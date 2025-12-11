import express from 'express';
import { generatePlaylistParams, analyzeImage, generateVibeAnalysis } from '../services/groq.js';
import { generateImage } from '../services/imagen.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

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
router.post('/analyze', initSpotifyApi, async (req, res) => {
    console.log('POST /ai/analyze hit');
    const { mood, duration = 60, vibeType = 'mix', energy, tempo, valence } = req.body;

    if (!mood) {
        return res.status(400).json({ error: 'Mood is required' });
    }

    try {
        // Calculate target number of tracks (avg song ~3.5 mins) + 20% buffer
        const avgSongLengthMins = 3.5;
        const targetTrackCount = Math.ceil((duration / avgSongLengthMins) * 1.2);

        console.log(`Targeting ~${targetTrackCount} tracks for ${duration} mins`);

        // 1. Generate parameters using Groq (Now returns 'reason' in suggestions)
        const aiParams = await generatePlaylistParams(mood, vibeType, targetTrackCount, { energy, tempo, valence });
        console.log('AI Params Generated');

        // 2. Search Spotify for each suggested track
        const trackPromises = aiParams.suggested_tracks.map(async (suggestion) => {
            try {
                // Specific search for Track + Artist
                const query = `track:${suggestion.song} artist:${suggestion.artist}`;
                const searchResult = await req.spotifyApi.searchTracks(query, { limit: 1 });

                // Return the first match if found
                if (searchResult.body.tracks.items.length > 0) {
                    const spotifyTrack = searchResult.body.tracks.items[0];

                    // ✅ KEY UPDATE: Merge the AI's reason with the Spotify data
                    return {
                        ...spotifyTrack,
                        ai_reason: suggestion.reason || "Fits the vibe perfectly."
                    };
                }
                return null;
            } catch (err) {
                console.error(`Failed to search for "${suggestion.song}":`, err);
                return null;
            }
        });

        const searchResults = await Promise.all(trackPromises);

        // Filter out nulls (failed searches) and remove duplicates
        const foundTracks = searchResults.filter(track => track !== null);
        const uniqueTracks = Array.from(new Map(foundTracks.map(track => [track.id, track])).values());

        // 3. Filter and Sort (Trust AI order, but filter crazy long songs)
        const filteredTracks = uniqueTracks.filter(track => track.duration_ms < 600000);

        // 4. Select tracks to fill duration
        const targetDurationMs = duration * 60 * 1000;
        let currentDurationMs = 0;
        const finalTracks = [];

        for (const track of filteredTracks) {
            // Always add at least one track, then check duration
            if (finalTracks.length > 0 && currentDurationMs >= targetDurationMs) break;

            finalTracks.push(track);
            currentDurationMs += track.duration_ms;
        }

        console.log(`Generated ${finalTracks.length} tracks. Total Duration: ${Math.round(currentDurationMs / 60000)} mins`);

        // 5. Return combined data
        res.json({
            ...aiParams,
            tracks: finalTracks, // Contains .ai_reason
            total_duration_mins: Math.round(currentDurationMs / 60000),
            isGuest: req.isGuest // Return auth status to frontend
        });

    } catch (error) {
        console.error('Error analyzing mood:', error);
        res.status(500).json({ error: 'Failed to analyze mood' });
    }
});

// --- 3. Image Analysis Route ---
router.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype; // e.g., 'image/png'
        const moodDescription = await analyzeImage(base64Image, mimeType);

        res.json({ mood: moodDescription });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
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

export default router;
