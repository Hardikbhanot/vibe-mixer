import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import { searchYouTube, searchYouTubeMultiple } from '../services/youtube.js';

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

        // 2. Build Search Queries (RAG-Powered if history exists, fallback to Generic)
        let selectedQueries = [];

        try {
            if (swipedSongs.length > 0) {
                // RAG-POWERED DISCOVERY
                // Pick a random recently liked song to find similar semantic vibes
                const seedSong = swipedSongs[Math.floor(Math.random() * swipedSongs.length)];
                
                // Find its embedding in TrackKnowledge using queryRaw (pgvector support)
                const knownTracks = await prisma.$queryRawUnsafe(
                    `SELECT "lyricsEmbedding" FROM "TrackKnowledge" 
                     WHERE LOWER(title) = LOWER($1) LIMIT 1`,
                    seedSong.songName
                );
                
                const knownTrack = knownTracks[0];

                if (knownTrack && knownTrack.lyricsEmbedding) {
                    // Vector Search for 10 semantically similar tracks!
                    const similarTracks = await prisma.$queryRawUnsafe(
                        `SELECT title, artist FROM "TrackKnowledge" 
                         ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 10`,
                        `[${knownTrack.lyricsEmbedding.join(',')}]`
                    );
                    
                    selectedQueries = similarTracks.map(t => `${t.title} ${t.artist}`);
                }
            }
        } catch (ragErr) {
            console.error('[Swipe Feed] RAG Vector Search failed, falling back to generic:', ragErr);
        }

        if (selectedQueries.length === 0) {
            // GENERIC FALLBACK (If no history or RAG failed)
            const categories = {
                hindiNew: ['hindi new', 'bollywood hits', 'punjabi 2024', 'trending india', 'arijit singh'],
                hindiOld: ['bollywood 90s', 'bollywood 2000s', 'kishore kumar', 'lat mangeshkar', 'old hindi songs'],
                englishNew: ['genre:pop', 'viral hits', 'top 50 global', 'genre:r-n-b'],
                englishOld: ['year:1990-2010 pop', '90s hits', 'classic rock', 'year:2000-2010']
            };
            const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
            selectedQueries = [
                pickRandom(categories.hindiNew),
                pickRandom(categories.hindiOld),
                pickRandom(categories.englishNew),
                pickRandom(categories.englishOld)
            ];
        }

        let candidates = [];

        for (const q of selectedQueries) {
            try {
                // Determine if this is likely a Hindi query for market targeting
                const isHindi = q.includes('hindi') || q.includes('bollywood') || q.includes('punjabi') || q.includes('india') || q.includes('kumar') || q.includes('singh');
                const market = isHindi ? 'IN' : 'US';
                const limit = 20;
                // Increase offset range for more variety (avoid repeats)
                const offset = Math.floor(Math.random() * 100); // Reduced offset slightly to ensure results exist

                let results;
                try {
                    results = await req.spotifyApi.searchTracks(q, { limit, offset, market });
                } catch (firstErr) {
                    if ((firstErr.statusCode === 403 || firstErr.statusCode === 401) && req.guestSpotifyApi) {
                        results = await req.guestSpotifyApi.searchTracks(q, { limit, offset, market });
                    } else {
                        throw firstErr;
                    }
                }

                if (results && results.body.tracks && results.body.tracks.items.length > 0) {
                    candidates.push(...results.body.tracks.items);
                } else {
                    throw new Error("No Spotify results");
                }
            } catch (err) {
                console.warn(`[Swipe Feed] Spotify Search failed for ${q}. Falling back to YouTube...`);
                try {
                    const randomSuffixes = ["2023", "2024", "2025", "official video", "music video", "live", "lyrics", "hit song", "viral"];
                    const suffix = randomSuffixes[Math.floor(Math.random() * randomSuffixes.length)];
                    const ytTracks = await searchYouTubeMultiple(`${q} ${suffix}`, 5);
                    if (ytTracks && ytTracks.length > 0) {
                        candidates.push(...ytTracks);
                    }
                } catch (ytErr) {
                    console.error(`[Swipe Feed] YouTube fallback failed for ${q}:`, ytErr);
                }
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
