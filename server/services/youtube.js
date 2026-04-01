import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY
});

/**
 * Searches YouTube for a song and returns metadata formatted like a Spotify track object.
 * @param {string} query - The search query (e.g. "Song Name Artist Name")
 * @returns {Promise<Object|null>} - A mocked Spotify track object derived from YouTube data.
 */
export const searchYouTube = async (query) => {
    try {
        console.log(`[YouTube] 🔍 Searching for: "${query}"`);
        
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 1,
            type: ['video'],
            videoCategoryId: '10', // Music category
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.warn(`[YouTube] 0 results for: "${query}"`);
            return null;
        }

        const video = response.data.items[0];
        const snippet = video.snippet;

        // Clean up title (YouTube often adds "Official Video" etc)
        const cleanTitle = snippet.title
            .replace(/\(Official.*?\)/gi, '')
            .replace(/\[Official.*?\]/gi, '')
            .replace(/ft\..*/gi, '')
            .trim();

        // Construct a "Mock Spotify Track" object so the frontend doesn't break
        return {
            id: video.id.videoId, // Use raw ID
            videoId: video.id.videoId, // Explicit field for save-to-playlist logic
            name: cleanTitle,
            artists: [{ name: snippet.channelTitle.replace(' - Topic', '') }],
            album: {
                name: "YouTube Music",
                images: [{ url: snippet.thumbnails.high.url }]
            },
            duration_ms: 180000, 
            external_urls: {
                spotify: `https://www.youtube.com/watch?v=${video.id.videoId}`
            },
            preview_url: null,
            is_youtube: true 
        };
    } catch (error) {
        console.error('[YouTube] Search error:', error.message);
        // Specifically throw quota errors so the caller can stop searching
        if (error.code === 403 || error.message.includes('quota')) {
            const quotaErr = new Error('YouTube Quota Exceeded');
            quotaErr.code = 'QUOTA_EXCEEDED';
            throw quotaErr;
        }
        return null;
    }
};
