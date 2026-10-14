import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import { searchYouTube, searchYouTubeMultiple } from '../services/youtube.js';
import { fetchTrackMetadata } from '../services/trackMetadata.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Computes the weighted centroid vector of a user's taste
 * Superlikes have 2x weight, likes have 1x weight
 */
function computeTasteCentroid(vectorsWithWeights) {
    if (!vectorsWithWeights || vectorsWithWeights.length === 0) return null;
    const dim = vectorsWithWeights[0].vector.length;
    const centroid = new Array(dim).fill(0);
    let totalWeight = 0;

    for (const item of vectorsWithWeights) {
        const weight = item.weight || 1.0;
        totalWeight += weight;
        for (let i = 0; i < dim; i++) {
            centroid[i] += item.vector[i] * weight;
        }
    }

    if (totalWeight === 0) return null;
    for (let i = 0; i < dim; i++) {
        centroid[i] = centroid[i] / totalWeight;
    }
    return centroid;
}

// Get Discovery Feed (Autonomous Taste Deck Powered by Dynamic Centroid)
router.get('/feed', authenticateToken, initSpotifyApi, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get recent swipes (past 14 days or last 60 swipes)
        const swipedSongs = await prisma.swipeHistory.findMany({
            where: { userId },
            orderBy: { created_at: 'desc' },
            take: 60,
            select: { songName: true, artistName: true, spotifyId: true, action: true }
        });

        const seenSet = new Set();
        swipedSongs.forEach(s => {
            if (s.spotifyId) seenSet.add(s.spotifyId);
            seenSet.add(`${s.songName.toLowerCase()}:${s.artistName.toLowerCase()}`);
        });

        // 2. Autonomous Taste Centroid Vector Pipeline
        let centroidTracks = [];
        const positiveSwipes = swipedSongs.filter(s => s.action === 'LIKE' || s.action === 'SUPERLIKE');

        if (positiveSwipes.length > 0) {
            try {
                // Fetch vector embeddings for the user's liked tracks
                const likedTitles = positiveSwipes.map(s => s.songName.toLowerCase().replace(/'/g, "''"));
                const knownRows = await prisma.$queryRawUnsafe(
                    `SELECT title, "lyricsEmbedding"::text as vec FROM "TrackKnowledge" 
                     WHERE LOWER(title) IN (${likedTitles.map(t => `'${t}'`).join(',')}) 
                       AND "lyricsEmbedding" IS NOT NULL LIMIT 25`
                );

                if (knownRows.length > 0) {
                    const rowMap = new Map();
                    knownRows.forEach(r => {
                        try {
                            rowMap.set(r.title.toLowerCase(), JSON.parse(r.vec));
                        } catch (e) {}
                    });

                    // Build weighted vectors
                    const weightedVectors = [];
                    positiveSwipes.forEach(s => {
                        const vec = rowMap.get(s.songName.toLowerCase());
                        if (vec) {
                            weightedVectors.push({
                                vector: vec,
                                weight: s.action === 'SUPERLIKE' ? 2.0 : 1.0
                            });
                        }
                    });

                    const centroid = computeTasteCentroid(weightedVectors);

                    if (centroid) {
                        // Vector search directly from our 14,727 track knowledge base!
                        const candidates = await prisma.$queryRawUnsafe(
                            `SELECT id, title, artist, "coverImage", "spotifyUri", "previewUrl", "durationMs", valence, energy, tempo
                             FROM "TrackKnowledge" 
                             WHERE "lyricsEmbedding" IS NOT NULL
                             ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 35`,
                            `[${centroid.join(',')}]`
                        );

                        // Filter unseen tracks and format into client-ready objects
                        for (const track of candidates) {
                            const trackKey = `${track.title.toLowerCase()}:${track.artist.toLowerCase()}`;
                            if (!seenSet.has(track.id) && !seenSet.has(trackKey)) {
                                seenSet.add(track.id);
                                seenSet.add(trackKey);

                                let cover = track.coverImage;
                                let preview = track.previewUrl;

                                // Fast asynchronous fallback for artwork if null
                                if (!cover) {
                                    fetchTrackMetadata(track.title, track.artist).then(meta => {
                                        if (meta?.coverImage) {
                                            prisma.trackKnowledge.update({
                                                where: { id: track.id },
                                                data: { coverImage: meta.coverImage, previewUrl: meta.previewUrl }
                                            }).catch(() => {});
                                        }
                                    }).catch(() => {});
                                }

                                centroidTracks.push({
                                    id: track.spotifyId || track.id,
                                    name: track.title,
                                    artists: [{ name: track.artist }],
                                    album: {
                                        name: track.title,
                                        images: [{ url: cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600' }]
                                    },
                                    uri: track.spotifyUri || `spotify:search:${encodeURIComponent(track.title + ' ' + track.artist)}`,
                                    preview_url: preview,
                                    external_urls: { spotify: `https://open.spotify.com/search/${encodeURIComponent(track.title + ' ' + track.artist)}` },
                                    duration_ms: track.durationMs || 210000,
                                    taste_match: true
                                });

                                if (centroidTracks.length >= 20) break;
                            }
                        }
                    }
                }
            } catch (centroidErr) {
                console.warn('[Swipe Feed] Taste Centroid calculation error:', centroidErr.message);
            }
        }

        // If we found enough centroid-matched tracks from our database, return them instantly (<100ms!)
        if (centroidTracks.length >= 15) {
            console.log(`[Swipe Feed] Served ${centroidTracks.length} tracks via Autonomous Taste Centroid.`);
            return res.json({ tracks: centroidTracks });
        }

        // 3. Fallback to Search Queries (for brand new users or sparse centroids)
        let selectedQueries = [];
        const categories = {
            hindiNew: ['hindi new', 'bollywood hits', 'punjabi 2024', 'trending india', 'arijit singh'],
            hindiOld: ['bollywood 90s', 'bollywood 2000s', 'kishore kumar', 'lata mangeshkar', 'old hindi songs'],
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

        let candidates = [...centroidTracks];

        for (const q of selectedQueries) {
            try {
                const isHindi = q.includes('hindi') || q.includes('bollywood') || q.includes('punjabi') || q.includes('india') || q.includes('kumar') || q.includes('singh');
                const market = isHindi ? 'IN' : 'US';
                const limit = 15;
                const offset = Math.floor(Math.random() * 80);

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
                }
            } catch (err) {
                try {
                    const ytTracks = await searchYouTubeMultiple(`${q} viral hits`, 5);
                    if (ytTracks && ytTracks.length > 0) candidates.push(...ytTracks);
                } catch (ytErr) {}
            }
        }

        // Filter Duplicates & Already Swiped
        const uniqueTracks = [];
        const trackIds = new Set();

        for (const track of candidates) {
            const trackKey = `${track.name.toLowerCase()}:${track.artists[0].name.toLowerCase()}`;
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
