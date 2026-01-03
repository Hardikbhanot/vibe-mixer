import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();
// const prisma = new PrismaClient(); // REMOVED

// Middleware to check Admin status
const checkAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Access Denied: Admins only' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Auth Check Failed' });
    }
};

// GET /api/admin/metrics
router.get('/metrics', authenticateToken, checkAdmin, async (req, res) => {
    try {
        // 1. Total Users
        const totalUsers = await prisma.user.count();
        const matchableUsers = await prisma.user.count({ where: { isMatchable: true } });

        // 2. Total Playlists & Public
        const totalPlaylists = await prisma.playlist.count();
        const publicPlaylists = await prisma.playlist.count({ where: { isPublic: true } });

        // 3. Matches Stats (Potential)
        // Since we calculate matches on the fly, we can't count "matches" in DB effectively unless we store them.
        // We do have a Match model, but it's for stored/accepted matches (likely unused yet).
        // Let's count "Matchable Users" as a proxy for engagement.

        // 4. Recent Users
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: { id: true, username: true, email: true, created_at: true, avatarUrl: true }
        });

        // 5. Total Likes
        const totalLikes = await prisma.like.count();

        res.json({
            users: { total: totalUsers, matchable: matchableUsers },
            playlists: { total: totalPlaylists, public: publicPlaylists },
            engagement: { likes: totalLikes },
            recentUsers
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch admin metrics' });
    }
});

// GET /api/admin/match-distribution (Heavy Calculation - On Demand)
// Runs the match algorithm for *everyone* against *everyone* to get a distribution? No, way too heavy.
// Instead, let's run it for the ADMIN user just to satisfy the request "match percentage for admin".
router.get('/match-test', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { matchesAsA: true, matchesAsB: true } // Just in case we use stored matches later
        });

        const candidates = await prisma.user.findMany({
            where: { isMatchable: true, id: { not: userId } },
            select: { id: true, username: true, topArtists: true }
        });

        const results = candidates.map(candidate => {
            // Re-use logic or import it (simplified here for speed)
            if (!currentUser.topArtists || !candidate.topArtists) return { score: 0 };

            const uArtists = currentUser.topArtists;
            const cArtists = candidate.topArtists;

            const setA = new Set(uArtists.map(a => a.name.toLowerCase()));
            const setB = new Set(cArtists.map(a => a.name.toLowerCase()));
            const intersection = new Set([...setA].filter(x => setB.has(x)));
            const union = new Set([...setA, ...setB]);

            return {
                username: candidate.username,
                score: union.size ? Math.round((intersection.size / union.size) * 100) : 0
            };
        }).sort((a, b) => b.score - a.score);

        res.json({ distribution: results });

    } catch (error) {
        res.status(500).json({ error: 'Match Test Failed' });
    }
});


export default router;
