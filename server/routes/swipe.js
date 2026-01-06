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
        // 1. Get songs swiped in the last 7 days (or all time)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 7);

        const swipedSongs = await prisma.swipeHistory.findMany({
            where: {
                userId,
                // created_at: { gte: twoDaysAgo } // Uncomment to enforce time limit if needed
            },
            select: { songName: true, artistName: true, spotifyId: true }
        });

        const seenSet = new Set();
        // Add ID-based dedupe
        swipedSongs.forEach(s => {
            if (s.spotifyId) seenSet.add(s.spotifyId);
            seenSet.add(`${s.songName.toLowerCase()}:${s.artistName.toLowerCase()}`);
        });

        // 2. Search Spotify for a Mix (Guaranteed Variety)
        const categories = {
            hindiNew: ['hindi new', 'bollywood hits', 'punjabi 2024', 'trending india', 'arijit singh'],
            hindiOld: ['bollywood 90s', 'bollywood 2000s', 'kishore kumar', 'lat mangeshkar', 'old hindi songs'],
            englishNew: ['genre:pop', 'viral hits', 'top 50 global', 'genre:r-n-b'],
            englishOld: ['year:1990-2010 pop', '90s hits', 'classic rock', 'year:2000-2010']
        };

        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Select one from each category to ensure the user's requested "variety"
        const selectedQueries = [
            pickRandom(categories.hindiNew),
            pickRandom(categories.hindiOld),
            pickRandom(categories.englishNew),
            pickRandom(categories.englishOld)
        ];

        let candidates = [];

        for (const q of selectedQueries) {
            try {
                // Determine if this is likely a Hindi query for market targeting
                const isHindi = q.includes('hindi') || q.includes('bollywood') || q.includes('punjabi') || q.includes('india') || q.includes('kumar') || q.includes('singh');
                const market = isHindi ? 'IN' : 'US';
                const limit = 20;
                // Increase offset range for more variety (avoid repeats)
                const offset = Math.floor(Math.random() * 100); // Reduced offset slightly to ensure results exist

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

            // Check both ID and Name-Artist pair
            if (!trackIds.has(track.id) && !seenSet.has(track.id) && !seenSet.has(trackKey)) {
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
        const { songName, artistName, spotifyId, action } = req.body;
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
                spotifyId,
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
