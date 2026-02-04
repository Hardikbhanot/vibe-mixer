import { getLyrics, getSong } from 'genius-lyrics-api';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GENIUS_ACCESS_TOKEN;

export const fetchLyrics = async (title, artist) => {
    if (!apiKey) {
        console.warn('[Lyrics] GENIUS_ACCESS_TOKEN is missing. Lyrics fetch skipped.');
        return null;
    }

    const options = {
        apiKey: apiKey,
        title: title,
        artist: artist,
        optimizeQuery: true
    };

    try {
        console.log(`[Lyrics] Fetching for: "${title}" by ${artist}...`);

        // getLyrics returns just the text, getSong returns metadata + text
        // simple text is enough for RAG
        const lyrics = await getLyrics(options);

        if (!lyrics) {
            console.log('[Lyrics] No lyrics found.');
            return null;
        }

        console.log(`[Lyrics] Found! Length: ${lyrics.length} chars.`);
        return lyrics;

    } catch (error) {
        console.error('[Lyrics] Error fetching lyrics:', error.message);
        return null; // Fail gracefully
    }
};
