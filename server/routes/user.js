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

export default router;
