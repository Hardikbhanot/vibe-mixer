import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Calculate Jaccard Similarity
// J(A,B) = |A ∩ B| / |A ∪ B|
const calculateMatchScore = (userArtists, candidateArtists) => {
    if (!userArtists || !candidateArtists || userArtists.length === 0 || candidateArtists.length === 0) {
        return { score: 0, shared: [] };
    }

    const setA = new Set(userArtists.map(a => a.name.toLowerCase())); // Use names for broader matching
    const setB = new Set(candidateArtists.map(a => a.name.toLowerCase()));

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return { score: 0, shared: [] };

    const score = (intersection.size / union.size) * 100;

    // Find the actual artist objects for the shared names
    const sharedNames = [...intersection];
    const sharedArtists = userArtists.filter(a => sharedNames.includes(a.name.toLowerCase()));

    return { score: Math.round(score), shared: sharedArtists.slice(0, 5) }; // Top 5 shared
};

// GET /api/match - Find matches
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get Current User's Data
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, topArtists: true, topTracks: true }
        });

        if (!currentUser || !currentUser.topArtists || currentUser.topArtists.length === 0) {
            return res.json({ matches: [], message: "You need to listen to more music or re-login to sync Spotify data!" });
        }

        // 2. Get Potential Candidates (Matchable & Not Self)
        const candidates = await prisma.user.findMany({
            where: {
                isMatchable: true,
                id: { not: userId }
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                bio: true,
                topArtists: true,
                vibeTags: true
            },
            take: 100 // Limit for performance
        });

        // 3. Calculate Scores
        const matches = candidates.map(candidate => {
            const result = calculateMatchScore(currentUser.topArtists, candidate.topArtists);
            return {
                user: {
                    id: candidate.id,
                    username: candidate.username,
                    avatarUrl: candidate.avatarUrl,
                    bio: candidate.bio,
                    vibeTags: candidate.vibeTags
                },
                score: result.score,
                sharedArtists: result.shared
            };
        })
            .filter(match => match.score > 0) // Only show if there is ANY overlap
            .sort((a, b) => b.score - a.score); // Sort by highest match

        res.json({ matches });

    } catch (error) {
        console.error('Match error:', error);
        res.status(500).json({ error: 'Failed to find matches' });
    }
});

export default router;
