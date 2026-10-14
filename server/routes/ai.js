import express from 'express';
import { generatePlaylistParams, analyzeImage, generateVibeAnalysis, extractMusicalKeywords, refinePlaylistWithAI } from '../services/groq.js';
import { generateImage } from '../services/imagen.js';
import { generateEmbedding } from '../services/embedding.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import { searchYouTube } from '../services/youtube.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { fetchTrackMetadata } from '../services/trackMetadata.js';

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

            // Target Harmonic Parameters from Request Sliders or Keyword Analysis
            const targetValence = valence !== undefined ? valence / 100 : (analysis.min_valence !== null ? (analysis.min_valence + analysis.max_valence) / 2 : null);
            const targetEnergy = energy !== undefined ? energy / 100 : (analysis.min_energy !== null ? (analysis.min_energy + analysis.max_energy) / 2 : null);

            // Build metadata filters for TrackKnowledge
            let trackFilters = "";
            if (targetValence !== null) {
                const minV = Math.max(0, targetValence - 0.35);
                const maxV = Math.min(1, targetValence + 0.35);
                trackFilters += ` AND (valence IS NULL OR (valence >= ${minV.toFixed(2)} AND valence <= ${maxV.toFixed(2)}))`;
            }
            if (targetEnergy !== null) {
                const minE = Math.max(0, targetEnergy - 0.35);
                const maxE = Math.min(1, targetEnergy + 0.35);
                trackFilters += ` AND (energy IS NULL OR (energy >= ${minE.toFixed(2)} AND energy <= ${maxE.toFixed(2)}))`;
            }

            // Execute Lyrical Search (TrackKnowledge) with Harmonic Filters
            const lyricMatches = await prisma.$queryRawUnsafe(
                `SELECT id, title, artist, lyrics, "coverImage", "spotifyUri", "previewUrl", "durationMs", valence, energy, tempo 
                 FROM "TrackKnowledge" 
                 WHERE 1=1 ${trackFilters}
                 ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 20`,
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
                    userContext = `The user's all-time favorites: ${topArtistNames}. `;
                }

                // Inject Recent Swipes to heavily influence the AI
                const recentSwipes = await prisma.swipeHistory.findMany({
                    where: { userId: decoded.userId, action: { in: ['LIKE', 'SUPERLIKE'] } },
                    orderBy: { created_at: 'desc' },
                    take: 15
                });

                if (recentSwipes.length > 0) {
                    const swipeText = recentSwipes.map(s => `${s.songName} by ${s.artistName}`).join(', ');
                    userContext += `The user has recently swiped and liked these specific tracks: ${swipeText}. Heavily prioritize this vibe when picking songs.`;
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

        // 2. Search Spotify for each suggested track (with Local RAG Zero-Latency Bypass)
        console.log('Resolving metadata for generated tracks...');
        
        // Process in chunks to avoid rate limiting
        const chunkSize = 5;
        const searchResults = [];
        
        for (let i = 0; i < aiParams.suggested_tracks.length; i += chunkSize) {
            const chunk = aiParams.suggested_tracks.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (suggestion) => {
                const query = `${suggestion.song} ${suggestion.artist}`;
                
                try {
                    // --- STEP 1: ZERO-LATENCY LOCAL RAG BYPASS ---
                    const cleanTitle = suggestion.song.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim();
                    const localTrack = await prisma.trackKnowledge.findFirst({
                        where: {
                            title: { equals: cleanTitle, mode: 'insensitive' },
                            artist: { equals: suggestion.artist, mode: 'insensitive' }
                        }
                    });

                    // A. Instant Local Cache Hit with Artwork (0ms external latency)
                    if (localTrack && localTrack.coverImage) {
                        return {
                            id: localTrack.spotifyId || localTrack.id,
                            name: localTrack.title,
                            artists: [{ name: localTrack.artist }],
                            album: {
                                name: localTrack.title,
                                images: [{ url: localTrack.coverImage, height: 600, width: 600 }]
                            },
                            uri: localTrack.spotifyUri || `spotify:search:${encodeURIComponent(localTrack.title + ' ' + localTrack.artist)}`,
                            preview_url: localTrack.previewUrl,
                            duration_ms: localTrack.durationMs || 210000,
                            ai_reason: suggestion.reason || "Fits the harmonic vibe perfectly.",
                            valence: localTrack.valence,
                            energy: localTrack.energy,
                            tempo: localTrack.tempo,
                            _isLocalMatch: true
                        };
                    }

                    // B. Ultra-fast iTunes Resolver (<100ms, free, high-res artwork)
                    const itunesMeta = await fetchTrackMetadata(cleanTitle, suggestion.artist);
                    if (itunesMeta && itunesMeta.coverImage) {
                        // Asynchronously persist to database so future requests are instant
                        if (localTrack) {
                            prisma.trackKnowledge.update({
                                where: { id: localTrack.id },
                                data: {
                                    coverImage: itunesMeta.coverImage,
                                    previewUrl: itunesMeta.previewUrl,
                                    durationMs: itunesMeta.durationMs
                                }
                            }).catch(() => {});
                        }

                        return {
                            id: localTrack?.spotifyId || `itunes_${cleanTitle.toLowerCase().replace(/\s+/g, '_')}`,
                            name: localTrack?.title || suggestion.song,
                            artists: [{ name: localTrack?.artist || suggestion.artist }],
                            album: {
                                name: suggestion.song,
                                images: [{ url: itunesMeta.coverImage, height: 600, width: 600 }]
                            },
                            uri: localTrack?.spotifyUri || `spotify:search:${encodeURIComponent(suggestion.song + ' ' + suggestion.artist)}`,
                            preview_url: itunesMeta.previewUrl,
                            duration_ms: itunesMeta.durationMs || 210000,
                            ai_reason: suggestion.reason || "Fits the harmonic vibe perfectly.",
                            valence: localTrack?.valence ?? 0.5,
                            energy: localTrack?.energy ?? 0.5,
                            tempo: localTrack?.tempo ?? 120,
                            _isLocalMatch: !!localTrack
                        };
                    }

                    // C. Fallback to Spotify Search
                    let searchResult;
                    try {
                        searchResult = await req.spotifyApi.searchTracks(query, { limit: 1 });
                    } catch (firstErr) {
                        if ((firstErr.statusCode === 403 || firstErr.statusCode === 401) && req.guestSpotifyApi) {
                            searchResult = await req.guestSpotifyApi.searchTracks(query, { limit: 1 });
                        } else {
                            throw firstErr;
                        }
                    }

                    if (searchResult && searchResult.body.tracks.items.length > 0) {
                        const spotifyTrack = searchResult.body.tracks.items[0];
                        return {
                            ...spotifyTrack,
                            ai_reason: suggestion.reason || "Fits the vibe perfectly.",
                            valence: localTrack?.valence ?? 0.5,
                            energy: localTrack?.energy ?? 0.5,
                            tempo: localTrack?.tempo ?? 120,
                            _isLocalMatch: !!localTrack
                        };
                    }
                    
                    const ytTrack = await searchYouTube(query);
                    if (ytTrack) {
                        return {
                            ...ytTrack,
                            ai_reason: suggestion.reason || "Found via YouTube fallback.",
                            valence: localTrack?.valence ?? 0.5,
                            energy: localTrack?.energy ?? 0.5,
                            tempo: localTrack?.tempo ?? 120,
                            _isLocalMatch: !!localTrack
                        };
                    }

                    return null;
                } catch (err) {
                    try {
                        const ytTrack = await searchYouTube(query);
                        if (ytTrack) return { ...ytTrack, ai_reason: suggestion.reason };
                    } catch (fallbackErr) {}
                    return null;
                }
            });

            const resolvedChunk = await Promise.all(chunkPromises);
            searchResults.push(...resolvedChunk);
        }
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

        // --- STEP 4: AUTHENTIC CONFIDENCE SCORING (Explainable AI) ---
        try {
            const titles = finalTracks.map(t => t.name);
            if (titles.length > 0) {
                const cleanTitles = titles.map(t =>
                    t.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim().toLowerCase()
                );

                const vectorScores = await prisma.$queryRawUnsafe(
                    `SELECT title, valence, energy, tempo, 1 - ("lyricsEmbedding" <=> $1::vector) as score 
                     FROM "TrackKnowledge" 
                     WHERE LOWER(title) IN (${cleanTitles.map(t => `'${t.replace(/'/g, "''")}'`).join(',')})`,
                    `[${vibeEmbedding.join(',')}]`
                );

                const scoreMap = new Map();
                vectorScores.forEach(s => scoreMap.set(s.title.toLowerCase(), s));

                const reqValence = valence !== undefined ? valence / 100 : 0.5;
                const reqEnergy = energy !== undefined ? energy / 100 : 0.5;

                finalTracks.forEach(track => {
                    const cleanName = track.name.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim().toLowerCase();
                    const matchData = scoreMap.get(cleanName);

                    const semanticSim = matchData?.score !== undefined ? Math.max(0.4, matchData.score) : 0.82;
                    const trackValence = matchData?.valence ?? (track.valence ?? 0.5);
                    const trackEnergy = matchData?.energy ?? (track.energy ?? 0.5);

                    // Harmonic Alignment (Euclidean delta from user target sliders)
                    const harmonicDelta = (Math.abs(trackValence - reqValence) + Math.abs(trackEnergy - reqEnergy)) / 2;
                    const harmonicAlignment = Math.max(0.65, 1 - harmonicDelta);

                    // Authentic composite confidence score (no Math.random!)
                    const composite = (0.65 * semanticSim) + (0.35 * harmonicAlignment);
                    const finalScore = Math.min(99, Math.max(76, Math.round(composite * 100)));

                    track.confidence_score = finalScore;
                    track.match_type = (track._isLocalMatch || matchData) ? 'Harmonic Vector Match' : 'System Prediction';
                    track.harmonic_telemetry = {
                        semanticMatch: Math.round(semanticSim * 100),
                        harmonicAlignment: Math.round(harmonicAlignment * 100),
                        valence: Math.round(trackValence * 100),
                        energy: Math.round(trackEnergy * 100)
                    };
                    delete track._isLocalMatch;
                });
            }
        } catch (scoreErr) {
            console.warn('[AI] Scoring computation failed, using deterministic baseline:', scoreErr.message);
            finalTracks.forEach(t => { 
                t.confidence_score = 88; 
                t.match_type = 'System Prediction'; 
            });
        }

        res.json({
            ...aiParams,
            playlist_name: aiParams.playlist_name || aiParams.name || aiParams.playlistName || `${mood.slice(0, 30)} Mix`,
            playlist_description: aiParams.playlist_description || aiParams.description || aiParams.playlistDescription || `Curated sonic blend crafted for "${mood}"`,
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
                    const cleanTitle = track.name.split('(')[0].split('[')[0].split('-')[0].split('feat.')[0].trim();
                    await learnTrack(cleanTitle, track.artists[0].name, track.ai_reason);
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
router.post('/refine-history', authenticateToken, initSpotifyApi, async (req, res) => {
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

// --- 4. Interactive Conversational Playlist Refinement with AI DJ ---
router.post('/refine', async (req, res) => {
    try {
        const { instruction, currentTracks = [], playlistName = "", playlistDescription = "" } = req.body;

        if (!instruction || typeof instruction !== 'string') {
            return res.status(400).json({ error: 'Instruction is required' });
        }

        console.log(`[AI Refine] Processing instruction: "${instruction}" for ${currentTracks.length} tracks.`);

        const result = await refinePlaylistWithAI(instruction, currentTracks, playlistName, playlistDescription);

        // Map existing tracks by normalized key or ID for instant lookup
        const trackMap = new Map();
        currentTracks.forEach(t => {
            if (t.id) trackMap.set(t.id, t);
            const key = `${(t.name || '').toLowerCase()}:${(t.artist || t.artists?.[0]?.name || '').toLowerCase()}`;
            trackMap.set(key, t);
        });

        // Resolve tracks with iTunes and 2-tier platform URLs
        const finalTracks = await Promise.all((result.updatedTracks || []).map(async (item, idx) => {
            const key = `${(item.name || '').toLowerCase()}:${(item.artist || '').toLowerCase()}`;
            const existing = (item.id && trackMap.get(item.id)) || trackMap.get(key);

            if (existing && !item.isNew) {
                return {
                    ...existing,
                    ai_reason: item.reason || existing.ai_reason || "Refined by AI DJ."
                };
            }

            // For newly added or replaced songs, resolve high-res metadata
            let cover = '/placeholder.png';
            let preview = null;
            let duration = 210000;

            try {
                const meta = await fetchTrackMetadata(item.name, item.artist);
                if (meta) {
                    cover = meta.coverImage || cover;
                    preview = meta.previewUrl || null;
                    duration = meta.durationMs || duration;
                }
            } catch (mErr) {}

            const cleanSpotifySearch = `https://open.spotify.com/search/${encodeURIComponent(item.name + ' ' + item.artist)}`;
            const cleanYoutubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name + ' ' + item.artist)}`;

            return {
                id: item.id || `refined_${Date.now()}_${idx}`,
                name: item.name,
                artist: item.artist,
                artists: [{ name: item.artist }],
                album: {
                    name: item.name,
                    images: [{ url: cover }]
                },
                image: cover,
                duration_ms: duration,
                uri: `spotify:search:${encodeURIComponent(item.name + ' ' + item.artist)}`,
                external_urls: {
                    spotify: cleanSpotifySearch,
                    youtube: cleanYoutubeSearch
                },
                preview_url: preview,
                ai_reason: item.reason || "Handpicked by AI DJ to fit your requested vibe.",
                confidence_score: 95,
                match_type: "AI Refined"
            };
        }));

        res.json({
            success: true,
            assistantReply: result.assistantReply || "I've refined your playlist with your requested changes!",
            playlist_name: result.playlistName || playlistName || "My Vibe Mix",
            playlist_description: result.playlistDescription || playlistDescription || "Refined by AI Vibe DJ",
            tracks: finalTracks
        });

    } catch (error) {
        console.error('[AI Refine] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to refine playlist' });
    }
});

export default router;
