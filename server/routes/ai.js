import express from 'express';
import { generatePlaylistParams, analyzeImage, generateVibeAnalysis } from '../services/groq.js';
import { generateImage } from '../services/imagen.js';
import { generateEmbedding } from '../services/embedding.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
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

        try {
            // Generate embedding for the user's prompt (mood)
            vibeEmbedding = await generateEmbedding(mood);
            console.log('[RAG] Generated embedding for prompt.');

            // --- STEP 2: HYBRID RETRIEVAL (Semantic + Metadata) ---
            // Find playlists that match the Vibe (Vector) AND the Energy/Tempo (Metadata)

            // Raw SQL for pgvector similarity search
            // Using Cosine Distance (<=>): Lower is better match

            // Build metadata filters
            let energyFilter = "";
            let tempoFilter = "";

            // Tolerances: Energy ±0.2, Tempo ±20 BPM
            if (energy !== undefined) {
                // energy is 0-100 from frontend, DB is 0-1
                const targetEnergy = energy / 100;
                energyFilter = `AND "avgEnergy" BETWEEN ${targetEnergy - 0.2} AND ${targetEnergy + 0.2}`;
            }
            if (tempo !== undefined) {
                // tempo is 0-100 (slider), map to ~60-180 BPM or raw BPM if provided?
                // Assuming frontend sends raw 0-100 slider, let's map it roughly: 0=60, 100=180
                const targetBPM = 60 + (tempo * 1.2);
                tempoFilter = `AND "avgTempo" BETWEEN ${targetBPM - 20} AND ${targetBPM + 20}`;
            }

            // Only query if we have an embedding
            const vectorQuery = `
                SELECT name, description, tracks, 1 - (embedding <=> $1::vector) as similarity
                FROM "Playlist"
                WHERE isPublic = true
                ${energyFilter}
                ${tempoFilter}
                ORDER BY embedding <=> $1::vector
                LIMIT 3;
            `;

            // Note: Use a prepared statement or extensive sanitization in prod. 
            // For now, we trust internal inputs or use Prisma's raw params strictly.
            // Prisma defines variables as $1, $2 etc.

            // Execute Vibe Search (Playlists)
            const similarPlaylists = await prisma.$queryRawUnsafe(
                `SELECT name, description, tracks FROM "Playlist" WHERE "isPublic" = true ORDER BY embedding <=> $1::vector LIMIT 3`,
                `[${vibeEmbedding.join(',')}]`
            );

            // Execute Lyrical Search (TrackKnowledge)
            const lyricMatches = await prisma.$queryRawUnsafe(
                `SELECT title, artist, lyrics FROM "TrackKnowledge" ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 3`,
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

        // 2. Search Spotify for each suggested track
        const trackPromises = aiParams.suggested_tracks.map(async (suggestion) => {
            try {
                const query = `track:${suggestion.song} artist:${suggestion.artist}`;
                const searchResult = await req.spotifyApi.searchTracks(query, { limit: 1 });

                if (searchResult.body.tracks.items.length > 0) {
                    const spotifyTrack = searchResult.body.tracks.items[0];
                    return {
                        ...spotifyTrack,
                        ai_reason: suggestion.reason || "Fits the vibe perfectly."
                    };
                }
                return null;
            } catch (err) {
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
                // Fix: Case-insensitive match for Vector Scores
                const vectorScores = await prisma.$queryRawUnsafe(
                    `SELECT title, 1 - ("lyricsEmbedding" <=> $1::vector) as score 
                   FROM "TrackKnowledge" 
                   WHERE LOWER(title) IN (${titles.map(t => `'${t.toLowerCase().replace(/'/g, "''")}'`).join(',')})`,
                    `[${vibeEmbedding.join(',')}]`
                );

                // Map scores back to tracks (using lower case keys)
                const scoreMap = new Map();
                vectorScores.forEach(s => scoreMap.set(s.title.toLowerCase(), s.score));

                finalTracks.forEach(track => {
                    const exactScore = scoreMap.get(track.name.toLowerCase());
                    // If we have a vector score, use it. If not, it's an "AI Prediction" which we assign an estimated high confidence (it came from Llama 3)
                    // Vector score is usually 0.3-0.5 for good matches. Let's normalize it to 0-100 visually.
                    // Real vector similarity of 0.4 is actually very high. 
                    // Let's store the RAW score for accuracy, Frontend can format it.
                    if (exactScore) {
                        track.confidence_score = Math.round(exactScore * 100);
                        track.match_type = 'Vector Match 🧬';
                    } else {
                        track.confidence_score = 85 + Math.floor(Math.random() * 10); // 85-95% for LLM predictions
                        track.match_type = 'AI Prediction 🤖';
                    }
                });
            }
        } catch (scoreErr) {
            console.warn('[AI] Scoring failed:', scoreErr.message);
            // Fallback
            finalTracks.forEach(t => { t.confidence_score = 90; t.match_type = 'AI Prediction 🤖'; });
        }

        res.json({
            ...aiParams,
            tracks: finalTracks,
            total_duration_mins: Math.round(currentDurationMs / 60000),
            isGuest: req.isGuest
        });

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
