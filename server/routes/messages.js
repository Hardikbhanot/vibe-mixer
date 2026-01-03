import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// 1. Send a Message
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.userId;

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'Receiver and content are required' });
        }

        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        res.json({ message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// 2. Get Conversations List (Latest message per user)
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find all messages sent or received by user
        // This is a bit complex in pure Prisma without joining.
        // Strategy: Get all unique userIds communicated with.

        // Option A: Raw Query (Fastest)
        // Option B: Find distinct sender/receiver IDs properly.

        // Let's iterate: find distinct conversation partners
        const sentTo = await prisma.message.findMany({
            where: { senderId: userId },
            distinct: ['receiverId'],
            select: { receiverId: true }
        });

        const receivedFrom = await prisma.message.findMany({
            where: { receiverId: userId },
            distinct: ['senderId'],
            select: { senderId: true }
        });

        const partnerIds = new Set([
            ...sentTo.map(m => m.receiverId),
            ...receivedFrom.map(m => m.senderId)
        ]);

        const conversations = [];

        for (const partnerId of partnerIds) {
            // Get partner details
            const partner = await prisma.user.findUnique({
                where: { id: partnerId },
                select: { id: true, username: true, avatarUrl: true }
            });

            if (!partner) continue;

            // Get last message
            const lastMessage = await prisma.message.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: partnerId },
                        { senderId: partnerId, receiverId: userId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });

            // Count unread
            const unreadCount = await prisma.message.count({
                where: {
                    senderId: partnerId,
                    receiverId: userId,
                    isRead: false
                }
            });

            conversations.push({
                user: partner,
                lastMessage: lastMessage.content,
                timestamp: lastMessage.createdAt,
                unread: unreadCount
            });
        }

        // Sort by newest
        conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ conversations });

    } catch (error) {
        console.error('Fetch conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// 3. Get Chat History with a User
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUserId = req.params.userId;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } }
            }
        });

        res.json({ messages });
    } catch (error) {
        console.error('Fetch chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// 4. Mark Messages as Read
router.post('/read/:senderId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const senderId = req.params.senderId;

        await prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: currentUserId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

export default router;
