import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get User History
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const history = await prisma.swipeHistory.findMany({
            where: { userId },
            orderBy: { created_at: 'desc' },
            take: 100 // Limit for performance
        });
        res.json({ history });
    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Delete a Swipe (Undo)
router.delete('/history/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        // Verify ownership
        const record = await prisma.swipeHistory.findUnique({ where: { id } });
        if (!record || record.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.swipeHistory.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// --- Social Profile Routes ---

// Get Own Profile Settings
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                bio: true,
                isPublic: true,
                isMatchable: true,
                topArtists: true,
                topTracks: true,
                avatarUrl: true,
                awards: true // Include awards
            }
        });
        res.json({ user });
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update User Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, bio, isPublic, isMatchable, avatarUrl } = req.body;
        const userId = req.user.userId;

        // Validation: Username uniqueness check
        if (username) {
            const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                bio,
                isPublic,
                isMatchable,
                avatarUrl // Save Base64 string
            }
        });

        res.json({ message: 'Profile updated', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get Discovery Feed (Public Users)
router.get('/discover', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { isPublic: true },
            select: {
                id: true,
                username: true,
                bio: true,
                topArtists: true,
                _count: {
                    select: { playlists: true }
                }
            },
            take: 50,
            orderBy: { created_at: 'desc' } // Showing newest members first
        });
        res.json({ users });
    } catch (error) {
        console.error('Fetch discovery error:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});

// Get Public Profile by Username
router.get('/public/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                bio: true,
                isPublic: true,
                topArtists: true,
                topTracks: true,
                playlists: {
                    where: { mood: 'public' }, // Assuming we might add public playlists later, or just show top vibes
                    take: 3
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.isPublic) {
            return res.status(403).json({ error: 'This profile is private' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Fetch public profile error:', error);
        res.status(500).json({ error: 'Failed to fetch public profile' });
    }
});

export default router;
