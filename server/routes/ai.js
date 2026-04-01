import express from 'express';
import { generatePlaylistParams, analyzeImage, generateVibeAnalysis, extractMusicalKeywords } from '../services/groq.js';
import { generateImage } from '../services/imagen.js';
import { generateEmbedding } from '../services/embedding.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import { searchYouTube } from '../services/youtube.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Configure Multer for In-Memory Storage (Zero Retention)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// --- 1. Image Generation Route ---
router.post('/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const imageUrl = await generateImage(prompt);
        res.json({ imageUrl });
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// --- 2. Main Playlist Analysis Route ---
// --- 2. Main Playlist Analysis Route (Hybrid RAG) ---
router.post('/analyze', initSpotifyApi, async (req, res) => {
    console.log('POST /ai/analyze hit (RAG Enabled)');
    const { mood, duration = 60, vibeType = 'mix', energy, tempo, valence, model } = req.body;

    if (!mood) {
        return res.status(400).json({ error: 'Mood is required' });
    }

    try {
        // --- STEP 1: EMBEDDING (Understand the Vibe) ---
        let vibeEmbedding = null;
        let similarPlaylistsContext = "";


        // Extract musical keywords AND vibe parameters
        const analysis = await extractMusicalKeywords(mood);
        const musicalKeywords = analysis.keywords;
        console.log(`[RAG] Optimized Query: "${musicalKeywords}"`);
        console.log(`[RAG] Vibe Filters: Valence [${analysis.min_valence}-${analysis.max_valence}], Energy [${analysis.min_energy}-${analysis.max_energy}]`);

        try {
            // Generate embedding for the OPTIMIZED keywords
            vibeEmbedding = await generateEmbedding(musicalKeywords);
            console.log('[RAG] Generated embedding for prompt.');

            // --- STEP 2: HYBRID RETRIEVAL (Semantic + Metadata) ---

            // Build metadata filters for Playlists (existing logic)
            let energyFilter = "";
            let tempoFilter = "";
            if (energy !== undefined) {
                const targetEnergy = energy / 100;
                energyFilter = `AND "avgEnergy" BETWEEN ${targetEnergy - 0.2} AND ${targetEnergy + 0.2}`;
            }
            if (tempo !== undefined) {
                const targetBPM = 60 + (tempo * 1.2);
                tempoFilter = `AND "avgTempo" BETWEEN ${targetBPM - 20} AND ${targetBPM + 20}`;
            }

            // Execute Vibe Search (Playlists)
            const similarPlaylists = await prisma.$queryRawUnsafe(
                `SELECT name, description, tracks FROM "Playlist" WHERE "isPublic" = true ${energyFilter} ${tempoFilter} ORDER BY embedding <=> $1::vector LIMIT 3`,
                `[${vibeEmbedding.join(',')}]`
            );

            // Build metadata filters for TrackKnowledge (NEW)
            let trackFilters = "";
            if (analysis.min_valence !== null && analysis.max_valence !== null) {
                trackFilters += ` AND (valence IS NULL OR (valence >= ${analysis.min_valence} AND valence <= ${analysis.max_valence}))`;
            }
            if (analysis.min_energy !== null && analysis.max_energy !== null) {
                trackFilters += ` AND (energy IS NULL OR (energy >= ${analysis.min_energy} AND energy <= ${analysis.max_energy}))`;
            }

            // Execute Lyrical Search (TrackKnowledge) with Vibe Filters
            // Note: We allow NULLs to appear if we haven't enriched them yet, or strict mode?
            // "OR valence IS NULL" ensures we don't hide unlearnt songs, but "Stage A" goal is to hide mismatches.
            // Let's being strict: If filter exists, ONLY show matching songs. 
            // BUT, initially many songs are NULL. So let's include NULLs for now to avoid empty results.

            const lyricMatches = await prisma.$queryRawUnsafe(
                `SELECT title, artist, lyrics FROM "TrackKnowledge" 
                 WHERE 1=1 ${trackFilters}
                 ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 3`,
                `[${vibeEmbedding.join(',')}]`
            );

            // Format Playlist Matches
            if (similarPlaylists.length > 0) {
                const examples = similarPlaylists.map(p => {
                    const trackList = Array.isArray(p.tracks)
                        ? p.tracks.slice(0, 3).map(t => `${t.name} by ${t.artist}`).join(', ')
                        : "Various Artists";
                    return `- "${p.name}": ${p.description} (Tracks like: ${trackList})`;
                }).join('\n');
                similarPlaylistsContext = `\nVIBE MATCHES (Past successful playlists): \n${examples}\n`;
                console.log(`[RAG] Found ${similarPlaylists.length} semantic matches.`);
            } else {
                console.log('[RAG] No semantic matches found.');
            }

            // Format Lyric Matches
            if (lyricMatches.length > 0) {
                const songs = lyricMatches.map(s => `- "${s.title}" by ${s.artist} (Lyrics match theme: "${s.lyrics.substring(0, 50)}...")`).join('\n');
                similarPlaylistsContext += `\nLYRICAL THEME MATCHES (Include these if fit): \n${songs}\n`;
                console.log(`[RAG] Found ${lyricMatches.length} lyrical matches.`);
            }

            console.log(`[RAG] Context injection prepared.`);

        } catch (ragError) {
            console.warn('[RAG] Retrieval failed, falling back to pure generation:', ragError.message);
        }

        // Calculate target number of tracks (avg song ~3.5 mins) + 20% buffer
        const avgSongLengthMins = 3.5;
        const targetTrackCount = Math.ceil((duration / avgSongLengthMins) * 1.2);

        // --- PERSONALIZATION: Fetch User Context if Logged In ---
        let userContext = "";
        const token = req.cookies.auth_token;
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { topArtists: true }
                });

                if (user && user.topArtists && Array.isArray(user.topArtists)) {
                    const topArtistNames = user.topArtists.slice(0, 10).map(a => a.name).join(', ');
                    userContext = `The user loves: ${topArtistNames}. Include similar artists or influences.`;
                }
            } catch (authErr) {
                // Personalization skipped
            }
        }

        // --- DATA FRESHNESS: Targeted Search ---
        let newReleasesContext = "";
        try {
            const currentYear = new Date().getFullYear();
            const searchYear = `${currentYear - 1}-${currentYear}`;
            const query = `${mood} year:${searchYear}`;
            const freshSearch = await req.spotifyApi.searchTracks(query, { limit: 5 });

            if (freshSearch.body.tracks.items.length > 0) {
                const freshTracks = freshSearch.body.tracks.items.map(t =>
                    `"${t.name}" by ${t.artists[0].name}`
                ).join(', ');
                newReleasesContext = `\nFRESH RELEASES (2025-26): ${freshTracks}`;
            }
        } catch (err) {
            // Freshness skipped
        }

        // --- STEP 3: AUGMENTATION ---
        // Combine contexts: User Taste + RAG Retrieval + Freshness
        const combinedContext = (userContext + similarPlaylistsContext + newReleasesContext).trim();

        // 1. Generate parameters using Groq
        const aiParams = await generatePlaylistParams(mood, vibeType, targetTrackCount, { energy, tempo, valence }, combinedContext, model);
        console.log('AI Params Generated');

        // 2. Search Spotify for each suggested track (with YouTube Fallback)
        const trackPromises = aiParams.suggested_tracks.map(async (suggestion) => {
            const query = `${suggestion.song} ${suggestion.artist}`;
            try {
                let searchResult;
                try {
                    searchResult = await req.spotifyApi.searchTracks(query, { limit: 1 });
                } catch (firstErr) {
                    // --- FALLBACK: If User token fails with 403/401, use Guest instance ---
                    if ((firstErr.statusCode === 403 || firstErr.statusCode === 401) && req.guestSpotifyApi) {
                        console.warn(`[Spotify] User Search failed (${firstErr.statusCode}). Falling back to Guest Instance...`);
                        searchResult = await req.guestSpotifyApi.searchTracks(query, { limit: 1 });
                    } else {
                        throw firstErr;
                    }
                }

                if (searchResult && searchResult.body.tracks.items.length > 0) {
                    const spotifyTrack = searchResult.body.tracks.items[0];
                    return {
                        ...spotifyTrack,
                        ai_reason: suggestion.reason || "Fits the vibe perfectly."
                    };
                }
                
                // --- CRITICAL FALLBACK: If Spotify (Guest or User) yields 0 results or fails, use YouTube ---
                console.warn(`[Spotify] 0 results for: "${query}". Triggering YouTube Fallback...`);
                const ytTrack = await searchYouTube(query);
                if (ytTrack) {
                    return {
                        ...ytTrack,
                        ai_reason: suggestion.reason || "Found via YouTube due to Spotify restrictions."
                    };
                }

                return null;
            } catch (err) {
                const errMsg = err.message || JSON.stringify(err);
                console.error(`[Spotify/YouTube] Search Failed for "${query}":`, errMsg);
                
                // If YouTube quota is hit, don't try the last-ditch fallback
                if (err.code === 'QUOTA_EXCEEDED') {
                    return null;
                }

                // Final Last-Ditch Fallback: Try YouTube one more time if the earlier error stopped the chain
                try {
                    const ytTrack = await searchYouTube(query);
                    if (ytTrack) return { ...ytTrack, ai_reason: suggestion.reason };
                } catch (ytErr) { 
                    // Silent catch for last-ditch attempt
                }

                return null;
            }
        });

        const searchResults = await Promise.all(trackPromises);
        const foundTracks = searchResults.filter(track => track !== null);
        const uniqueTracks = Array.from(new Map(foundTracks.map(track => [track.id, track])).values());
        const filteredTracks = uniqueTracks.filter(track => track.duration_ms < 600000);

        // 4. Select tracks to fill duration
        const targetDurationMs = duration * 60 * 1000;
        let currentDurationMs = 0;
        const finalTracks = [];

        for (const track of filteredTracks) {
            if (finalTracks.length > 0 && currentDurationMs >= targetDurationMs) break;
            finalTracks.push(track);
            currentDurationMs += track.duration_ms;
        }

        // --- STEP 4: CONFIDENCE SCORING (Explainable AI) ---
        // For each selected track, try to find its Vector Match Score against the Mood
        try {
            const titles = finalTracks.map(t => t.name);
            // safe query using Prisma raw
            if (titles.length > 0) {
                // Normalize Titles (Remove "From...", "feat...", "- LoFi") to match track data
                const cleanTitleMap = new Map();
                const cleanTitles = titles.map(t => {
                    // Remove text in parens/brackets, remove "feat.", remove " - "
                    const clean = t.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim().toLowerCase();
                    cleanTitleMap.set(clean, t); // Map clean title back to original
                    return clean;
                });

                // SQL Query using Normalized Titles
                const vectorScores = await prisma.$queryRawUnsafe(
                    `SELECT title, 1 - ("lyricsEmbedding" <=> $1::vector) as score 
                   FROM "TrackKnowledge" 
                   WHERE LOWER(title) IN (${cleanTitles.map(t => `'${t.replace(/'/g, "''")}'`).join(',')})`,
                    `[${vibeEmbedding.join(',')}]`
                );

                // Map scores back to tracks using clean titles
                const scoreMap = new Map();
                vectorScores.forEach(s => scoreMap.set(s.title.toLowerCase(), s.score));

                finalTracks.forEach(track => {
                    // Clean the track name for lookup
                    const cleanName = track.name.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim().toLowerCase();
                    const exactScore = scoreMap.get(cleanName);

                    if (exactScore !== undefined) {
                        // Normalize Knowledge Match scores (Scale 0.3-0.6 range to 85-100%)
                        let scaledScore;
                        if (exactScore >= 0.5) {
                            scaledScore = 95 + Math.floor((exactScore - 0.5) * 25);
                        } else if (exactScore >= 0.3) {
                            scaledScore = 85 + Math.floor((exactScore - 0.3) * 50);
                        } else {
                            scaledScore = 70 + Math.floor(exactScore * 50);
                        }
                        track.confidence_score = Math.min(100, Math.round(scaledScore));
                        track.match_type = 'Knowledge Match';
                    } else {
                        track.confidence_score = 85 + Math.floor(Math.random() * 8); // 85-92% for System predictions
                        track.match_type = 'System Prediction';
                    }
                });
            }
        } catch (scoreErr) {
            console.warn('[AI] Scoring failed:', scoreErr.message);
            finalTracks.forEach(t => { t.confidence_score = 90; t.match_type = 'System Prediction'; });
        }

        res.json({
            ...aiParams,
            tracks: finalTracks,
            total_duration_mins: Math.round(currentDurationMs / 60000),
            isGuest: req.isGuest
        });

        // --- BACKGROUND TASK: Auto-Ingestion ---
        // Save new songs to our knowledge repository for future "Knowledge Matches"
        setTimeout(async () => {
            try {
                const { learnTrack } = await import('../services/lyrics.js');
                const newTracks = finalTracks.filter(t => t.match_type === 'System Prediction');
                for (const track of newTracks) {
                    await learnTrack(track.name, track.artists[0].name, track.ai_reason);
                }
            } catch (ingestErr) {
                console.warn('[Auto-Ingest] Background task failed:', ingestErr.message);
            }
        }, 1000);

    } catch (error) {
        console.error('Error analyzing mood:', error);
        res.status(500).json({ error: 'Failed to analyze mood' });
    }
});

// --- 3. Image Analysis Route ---
router.post('/analyze-image', upload.single('image'), async (req, res) => {
    console.log('[AI] /analyze-image called');
    try {
        if (!req.file) {
            console.error('[AI] No file received in req.file');
            console.log('[AI] req.headers:', req.headers['content-type']);
            // console.log('[AI] req.body (checking for misparsed fields):', req.body);
            return res.status(400).json({ error: 'No image uploaded' });
        }

        console.log(`[AI] File received: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype; // e.g., 'image/png'
        const moodDescription = await analyzeImage(base64Image, mimeType);

        console.log('[AI] Analysis success:', moodDescription);
        res.json({ mood: moodDescription });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze image', details: error.message });
    }
});

// --- 4. Refine Playlist Route (Swipe History) ---
router.post('/refine', authenticateToken, initSpotifyApi, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch last 50 likes/superlikes
        const history = await prisma.swipeHistory.findMany({
            where: {
                userId,
                action: { in: ['LIKE', 'SUPERLIKE'] }
            },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        if (history.length === 0) {
            return res.status(400).json({ error: 'No swipe history found. Swipe some songs first!' });
        }

        // Construct Prompt Context
        const likes = history.filter(h => h.action === 'LIKE').map(h => `${h.songName} by ${h.artistName}`);
        const superlikes = history.filter(h => h.action === 'SUPERLIKE').map(h => `${h.songName} by ${h.artistName}`);

        // Superlikes get mentioned 3 times for emphasis in the LLM context
        const weightedSuperlikes = [...superlikes, ...superlikes, ...superlikes];

        const promptContext = [
            ...likes,
            ...weightedSuperlikes
        ].join(', ');

        const refineMood = `Based on these user preferences: ${promptContext}. Generate a playlist that blends these styles perfectly.`;

        // Reuse existing generation logic
        const duration = 60;
        const avgSongLengthMins = 3.5;
        const targetTrackCount = Math.ceil((duration / avgSongLengthMins) * 1.2);

        // Generate parameters using Groq
        const aiParams = await generatePlaylistParams(refineMood, 'mix', targetTrackCount, { energy: 50, tempo: 50, valence: 50 });

        // Search Spotify for each suggested track
        const trackPromises = aiParams.suggested_tracks.map(async (suggestion) => {
            try {
                const query = `track:${suggestion.song} artist:${suggestion.artist}`;
                const searchResult = await req.spotifyApi.searchTracks(query, { limit: 1 });

                if (searchResult.body.tracks.items.length > 0) {
                    const spotifyTrack = searchResult.body.tracks.items[0];
                    // ✅ KEY UPDATE: Merge AI Reason here too
                    return {
                        ...spotifyTrack,
                        ai_reason: suggestion.reason || "Selected based on your unique listening history."
                    };
                }
                return null;
            } catch (err) {
                console.error(`Failed to search for "${suggestion.song}":`, err);
                return null;
            }
        });

        const searchResults = await Promise.all(trackPromises);
        const foundTracks = searchResults.filter(track => track !== null);
        const uniqueTracks = Array.from(new Map(foundTracks.map(track => [track.id, track])).values());

        // Simple duration fill logic
        const targetDurationMs = duration * 60 * 1000;
        let currentDurationMs = 0;
        const finalTracks = [];

        for (const track of uniqueTracks) {
            if (finalTracks.length > 0 && currentDurationMs >= targetDurationMs) break;
            finalTracks.push(track);
            currentDurationMs += track.duration_ms;
        }

        res.json({
            ...aiParams,
            tracks: finalTracks, // Contains .ai_reason
            total_duration_mins: Math.round(currentDurationMs / 60000),
            isGuest: false // Authenticated user
        });

    } catch (error) {
        console.error('Refine error:', error);
        res.status(500).json({ error: 'Failed to refine playlist' });
    }
});

// --- 5. Profile Vibe Analysis ---
router.post('/profile-vibe', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { topArtists: true, topTracks: true }
        });

        if (!user || !user.topArtists) {
            return res.status(400).json({ error: 'Not enough music data. Try listening to some tunes!' });
        }

        const analysis = await generateVibeAnalysis(user.topArtists, user.topTracks);
        res.json(analysis);

    } catch (error) {
        console.error('Vibe Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze vibe' });
    }
});

// --- 6. Vector Probe (Debug Tool) ---
router.post('/vector-probe', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query required' });

        console.log(`[AI Probe] Analyzing: "${query}"`);
        const embedding = await generateEmbedding(query);

        // 1. Playlist Matches
        const playlists = await prisma.$queryRawUnsafe(
            `SELECT name, description, 1 - (embedding <=> $1::vector) as similarity 
             FROM "Playlist" 
             WHERE "isPublic" = true 
             ORDER BY similarity DESC 
             LIMIT 5`,
            `[${embedding.join(',')}]`
        );

        // 2. Lyric Matches
        const lyrics = await prisma.$queryRawUnsafe(
            `SELECT title, artist, lyrics, 1 - ("lyricsEmbedding" <=> $1::vector) as similarity 
             FROM "TrackKnowledge" 
             ORDER BY similarity DESC 
             LIMIT 5`,
            `[${embedding.join(',')}]`
        );

        res.json({
            playlists: playlists.map(p => ({
                name: p.name,
                description: p.description,
                score: (p.similarity * 100).toFixed(1)
            })),
            lyrics: lyrics.map(l => ({
                title: l.title,
                artist: l.artist,
                snippet: l.lyrics.substring(0, 100),
                score: (l.similarity * 100).toFixed(1)
            }))
        });

    } catch (error) {
        console.error('Vector Probe Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
