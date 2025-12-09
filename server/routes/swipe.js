import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get Discovery Feed (Hindi + English Mix, Non-Repeating)
router.get('/feed', authenticateToken, initSpotifyApi, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get songs swiped in the last 48 hours (or all time, per user pref "never" also works)
        // Let's do last 7 days for safety, or all time if possible to avoid repeats
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const swipedSongs = await prisma.swipeHistory.findMany({
            where: {
                userId,
                // created_at: { gte: twoDaysAgo } // Uncomment to enforce time limit
            },
            select: { songName: true, artistName: true }
        });

        const seenSet = new Set(swipedSongs.map(s => `${s.songName.toLowerCase()}:${s.artistName.toLowerCase()}`));

        // 2. Search Spotify for a Mix
        // We'll search for a few different vibes to create a mix
        const queries = [
            'genre:pop', // English Pop
            'genre:indie',
            'hindi top 50', // Hindi
            'bollywood',
            'punjabi',
            'lofi'
        ];

        // Shuffle queries and pick 3
        const selectedQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 3);

        let candidates = [];

        for (const q of selectedQueries) {
            try {
                // Determine if this is likely a Hindi query for market targeting
                const market = (q.includes('hindi') || q.includes('bollywood') || q.includes('punjabi')) ? 'IN' : 'US';
                const limit = 15;
                const offset = Math.floor(Math.random() * 50); // Random offset for variety

                const results = await req.spotifyApi.searchTracks(q, { limit, offset, market });
                if (results.body.tracks) {
                    candidates.push(...results.body.tracks.items);
                }
            } catch (err) {
                console.error(`Search failed for ${q}:`, err);
            }
        }

        // 3. Filter Duplicates & Already Swiped
        const uniqueTracks = [];
        const trackIds = new Set();

        for (const track of candidates) {
            // Identifier for "seen" check
            const trackKey = `${track.name.toLowerCase()}:${track.artists[0].name.toLowerCase()}`;

            if (!trackIds.has(track.id) && !seenSet.has(trackKey)) {
                trackIds.add(track.id);
                uniqueTracks.push({
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: track.album,
                    uri: track.uri,
                    external_urls: track.external_urls,
                    duration_ms: track.duration_ms
                });
            }
        }

        // 4. Shuffle Final Result
        const feed = uniqueTracks.sort(() => 0.5 - Math.random()).slice(0, 20);

        res.json({ tracks: feed });

    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// Save a swipe action
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { songName, artistName, action } = req.body;
        const userId = req.user.userId;

        if (!songName || !artistName || !action) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate action enum
        if (!['LIKE', 'DISLIKE', 'SUPERLIKE'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const swipe = await prisma.swipeHistory.create({
            data: {
                userId,
                songName,
                artistName,
                action
            }
        });

        res.status(201).json({ message: 'Swipe saved', swipe });

    } catch (error) {
        console.error('Swipe error:', error);
        res.status(500).json({ error: 'Failed to save swipe' });
    }
});

// Get user's recent likes (for debugging or UI)
router.get('/likes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const likes = await prisma.swipeHistory.findMany({
            where: {
                userId,
                action: { in: ['LIKE', 'SUPERLIKE'] }
            },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        res.json(likes);
    } catch (error) {
        console.error('Fetch likes error:', error);
        res.status(500).json({ error: 'Failed to fetch likes' });
    }
});

export default router;
