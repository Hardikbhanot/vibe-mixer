import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js'; // Ensure you have this

const router = express.Router();
const prisma = new PrismaClient();

// 1. Save a Playlist to History
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, coverImage, mood, tracks } = req.body;
        const userId = req.user.userId; // Extracted from JWT

        const playlist = await prisma.playlist.create({
            data: {
                name,
                description,
                coverImage,
                mood,
                tracks, // Prisma automatically handles the JSON conversion
                userId
            }
        });

        res.json({ message: 'Playlist saved to history!', playlist });
    } catch (error) {
        console.error('Save playlist error:', error);
        res.status(500).json({ error: 'Failed to save playlist' });
    }
});

// 2. Get User's Playlist History
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const playlists = await prisma.playlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(playlists);
    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// 3. Delete a Playlist
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Ensure user owns the playlist
        const count = await prisma.playlist.deleteMany({
            where: {
                id: parseInt(id),
                userId // Security check
            }
        });

        if (count.count === 0) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

export default router;
