import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * YouTube API Key Rotator
 * Handles switching between multiple API keys when quota is reached.
 */
class YouTubeRotator {
    constructor() {
        // Load keys from GOOGLE_API_KEY (comma separated) or fallback to individual variables
        const rawKeys = process.env.GOOGLE_API_KEYS || process.env.GOOGLE_API_KEY;
        this.keys = rawKeys ? rawKeys.split(',').map(k => k.trim()) : [];
        this.currentIndex = 0;
        this.instances = new Map();

        console.log(`[YouTube Rotator] Initialized with ${this.keys.length} keys.`);
    }

    get currentKey() {
        return this.keys[this.currentIndex];
    }

    getInstance() {
        const key = this.currentKey;
        if (!key) return null;

        if (!this.instances.has(key)) {
            this.instances.set(key, google.youtube({
                version: 'v3',
                auth: key
            }));
        }
        return this.instances.get(key);
    }

    rotate() {
        if (this.keys.length <= 1) return false;
        
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        console.warn(`[YouTube Rotator] 🔄 Switched to Key Index ${this.currentIndex} due to Quota/Error.`);
        return true;
    }

    get hasKeys() {
        return this.keys.length > 0;
    }
}

export const rotator = new YouTubeRotator();

/**
 * Searches YouTube for a song and returns metadata formatted like a Spotify track object.
 * Implements retry logic for Quota rotation.
 */
export const searchYouTube = async (query, retryCount = 0) => {
    try {
        const youtube = rotator.getInstance();
        if (!youtube) {
            console.error('[YouTube] No API keys configured.');
            return null;
        }

        console.log(`[YouTube] 🔍 Searching (Key ${rotator.currentIndex}): "${query}"`);
        
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

        const cleanTitle = snippet.title
            .replace(/\(Official.*?\)/gi, '')
            .replace(/\[Official.*?\]/gi, '')
            .replace(/ft\..*/gi, '')
            .trim();

        return {
            id: video.id.videoId,
            videoId: video.id.videoId,
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
        // Quota errors are usually 403 or have 'quota' in message
        const isQuotaError = error.code === 403 || (error.errors && error.errors[0]?.reason === 'quotaExceeded') || error.message.toLowerCase().includes('quota');

        if (isQuotaError) {
            console.warn(`[YouTube] Key ${rotator.currentIndex} Quota Exceeded.`);
            
            // Try to rotate
            if (rotator.rotate() && retryCount < rotator.keys.length) {
                return await searchYouTube(query, retryCount + 1);
            }

            const quotaErr = new Error('All YouTube API Quotas Exceeded');
            quotaErr.code = 'QUOTA_EXCEEDED';
            throw quotaErr;
        }

        console.error('[YouTube] Search error:', error.message);
        return null;
    }
};
