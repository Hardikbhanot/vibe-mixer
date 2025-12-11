import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js'; // Ensure you have this

const router = express.Router();
const prisma = new PrismaClient();

// 1. Save a Playlist to History
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, coverImage, mood, tracks, isPublic } = req.body;
        const userId = req.user.userId; // Extracted from JWT
        console.log(`[Playlist] Saving for user ${userId}: ${name}`);

        // Validate User Existence (Fix for Stale Token/DB Reset)
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            console.warn(`[Playlist] User ${userId} not found in DB. Stale token?`);
            return res.status(401).json({ error: 'User not found. Please re-login.' });
        }

        // Check for duplicates (Idempotency)
        const existingPlaylist = await prisma.playlist.findFirst({
            where: {
                userId,
                name: name
            }
        });

        if (existingPlaylist) {
            console.log(`[Playlist] Duplicate found for ${name}, returning existing.`);
            return res.json({ message: 'Playlist already saved!', playlist: existingPlaylist });
        }

        const playlist = await prisma.playlist.create({
            data: {
                name,
                description,
                coverImage,
                mood,
                tracks: tracks || [], // Ensure tracks is at least an empty array
                isPublic: isPublic || false, // Default to private if not specified
                userId
            }
        });

        res.json({ message: 'Playlist saved to history!', playlist });
    } catch (error) {
        console.error('Save playlist error:', error);
        res.status(500).json({ error: 'Failed to save playlist', details: error.message });
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
                id: id, // Fixed: UUID is a string, do not parseInt
                userId // Security check
            }
        });

        if (count.count === 0) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// 4. Update a Playlist
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { name, description, isPublic, coverImage } = req.body;

        // Ensure user owns the playlist
        const playlist = await prisma.playlist.findUnique({
            where: { id }
        });

        if (!playlist || playlist.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updatedPlaylist = await prisma.playlist.update({
            where: { id },
            data: {
                name,
                description,
                isPublic,
                coverImage
            }
        });

        res.json({ message: 'Playlist updated', playlist: updatedPlaylist });
    } catch (error) {
        console.error('Update playlist error:', error);
        res.status(500).json({ error: 'Failed to update playlist' });
    }
});

// 5. Get Public Playlists (Discovery)
router.get('/public', async (req, res) => {
    try {
        const playlists = await prisma.playlist.findMany({
            where: { isPublic: true },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ playlists });
    } catch (error) {
        console.error('Fetch public playlists error:', error);
        res.status(500).json({ error: 'Failed to fetch discovery feed' });
    }
});

// 5a. Get Single Public Playlist
router.get('/public/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const playlist = await prisma.playlist.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        if (!playlist.isPublic) {
            return res.status(403).json({ error: 'This playlist is private' });
        }

        res.json(playlist);
    } catch (error) {
        console.error('Fetch public playlist error:', error);
        res.status(500).json({ error: 'Failed to fetch playlist' });
    }
});

export default router;
