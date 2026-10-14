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
 * High-performance, zero-quota YouTube video ID scraper.
 * Fetches the public YouTube search page directly in <200ms without API limits.
 */
export const scrapeYouTubeVideoId = async (query) => {
    try {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const html = await res.text();
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        return match ? match[1] : null;
    } catch (err) {
        return null;
    }
};

/**
 * Searches YouTube for a song and returns metadata formatted like a Spotify track object.
 * Implements retry logic for Quota rotation with zero-quota scraper fallback.
 */
export const searchYouTube = async (query, retryCount = 0) => {
    try {
        const youtube = rotator.getInstance();
        if (!youtube) {
            console.log(`[YouTube] No API keys configured. Using zero-quota scraper for "${query}"...`);
            const scrapedId = await scrapeYouTubeVideoId(query);
            if (scrapedId) {
                return {
                    id: scrapedId,
                    videoId: scrapedId,
                    name: query.replace('Official Audio', '').trim(),
                    artists: [{ name: 'YouTube Artist' }],
                    album: {
                        name: "YouTube Music",
                        images: [{ url: `https://i.ytimg.com/vi/${scrapedId}/hqdefault.jpg` }]
                    },
                    duration_ms: 180000,
                    external_urls: {
                        spotify: `https://www.youtube.com/watch?v=${scrapedId}`,
                        youtube: `https://www.youtube.com/watch?v=${scrapedId}`
                    },
                    preview_url: null,
                    is_youtube: true
                };
            }
            return null;
        }

        console.log(`[YouTube] 🔍 Searching (Key ${rotator.currentIndex}): "${query}"`);
        
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 1,
            type: ['video'],
            videoCategoryId: '10', // Music category
            order: 'viewCount',    // Ensures the most popular/official video is returned
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.warn(`[YouTube] 0 results for: "${query}". Attempting scraper fallback...`);
            const scrapedId = await scrapeYouTubeVideoId(query);
            if (scrapedId) {
                return {
                    id: scrapedId,
                    videoId: scrapedId,
                    name: query.replace('Official Audio', '').trim(),
                    artists: [{ name: 'YouTube Music' }],
                    album: {
                        name: "YouTube Music",
                        images: [{ url: `https://i.ytimg.com/vi/${scrapedId}/hqdefault.jpg` }]
                    },
                    duration_ms: 180000,
                    external_urls: {
                        spotify: `https://www.youtube.com/watch?v=${scrapedId}`,
                        youtube: `https://www.youtube.com/watch?v=${scrapedId}`
                    },
                    preview_url: null,
                    is_youtube: true
                };
            }
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
                spotify: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                youtube: `https://www.youtube.com/watch?v=${video.id.videoId}`
            },
            preview_url: null,
            is_youtube: true 
        };
    } catch (error) {
        // Quota errors are usually 403 or have 'quota' in message
        const isQuotaError = error.code === 403 || (error.errors && error.errors[0]?.reason === 'quotaExceeded') || error.message.toLowerCase().includes('quota');

        if (isQuotaError) {
            console.warn(`[YouTube] Key ${rotator.currentIndex} Quota Exceeded. Rotating or falling back to scraper...`);
            
            // Try to rotate if more keys exist
            if (rotator.rotate() && retryCount < rotator.keys.length) {
                return await searchYouTube(query, retryCount + 1);
            }

            // Zero-quota scraper fallback
            console.log(`[YouTube] Fallback to zero-quota scraper for "${query}"...`);
            const scrapedId = await scrapeYouTubeVideoId(query);
            if (scrapedId) {
                return {
                    id: scrapedId,
                    videoId: scrapedId,
                    name: query.replace('Official Audio', '').trim(),
                    artists: [{ name: 'YouTube Music' }],
                    album: {
                        name: "YouTube Music",
                        images: [{ url: `https://i.ytimg.com/vi/${scrapedId}/hqdefault.jpg` }]
                    },
                    duration_ms: 180000,
                    external_urls: {
                        spotify: `https://www.youtube.com/watch?v=${scrapedId}`,
                        youtube: `https://www.youtube.com/watch?v=${scrapedId}`
                    },
                    preview_url: null,
                    is_youtube: true
                };
            }
        }

        console.error('[YouTube] Search error:', error.message);
        return null;
    }
};

/**
 * Searches YouTube for multiple songs (Swipe Feed Fallback).
 */
export const searchYouTubeMultiple = async (query, limit = 5, retryCount = 0) => {
    try {
        const youtube = rotator.getInstance();
        if (!youtube) return [];
        
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 50, // Fetch max to get deep variety
            type: ['video'],
            videoCategoryId: '10',
            order: 'viewCount'
        });

        if (!response.data.items) return [];

        // Shuffle the 50 results so it's not always the exact same tracks on refresh
        const shuffled = response.data.items.sort(() => 0.5 - Math.random());
        // Pick only the requested limit
        const selected = shuffled.slice(0, limit);

        return selected.map(video => {
            const snippet = video.snippet;
            const cleanTitle = snippet.title.replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim();
            return {
                id: video.id.videoId,
                videoId: video.id.videoId,
                name: cleanTitle,
                artists: [{ name: snippet.channelTitle.replace(' - Topic', '') }],
                album: { name: "YouTube Music", images: [{ url: snippet.thumbnails.high.url }] },
                duration_ms: 180000,
                external_urls: { spotify: `https://www.youtube.com/watch?v=${video.id.videoId}` },
                is_youtube: true
            };
        });
    } catch (error) {
        const isQuotaError = error.code === 403 || error.message.toLowerCase().includes('quota');
        if (isQuotaError && rotator.rotate() && retryCount < rotator.keys.length) {
            return await searchYouTubeMultiple(query, limit, retryCount + 1);
        }
        return [];
    }
};
