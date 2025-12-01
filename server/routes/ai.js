import express from 'express';
import { generatePlaylistParams } from '../services/gemini.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
    const { mood } = req.body;

    if (!mood) {
        return res.status(400).json({ error: 'Mood prompt is required' });
    }

    try {
        const params = await generatePlaylistParams(mood);
        res.json(params);
    } catch (error) {
        console.error('Error analyzing mood:', error);
        res.status(500).json({ error: 'Failed to analyze mood' });
    }
});

export default router;
