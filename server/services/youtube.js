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
 * Parses human-readable YouTube view strings into integers (e.g. "1.2M views", "15K views", "840 views").
 */
export function parseYouTubeViews(viewStr) {
    if (!viewStr) return 0;
    const clean = viewStr.toLowerCase().replace(/views?/g, '').trim();
    if (clean.includes('b')) {
        return Math.round(parseFloat(clean.replace('b', '')) * 1_000_000_000);
    }
    if (clean.includes('m')) {
        return Math.round(parseFloat(clean.replace('m', '')) * 1_000_000);
    }
    if (clean.includes('k')) {
        return Math.round(parseFloat(clean.replace('k', '')) * 1_000);
    }
    const num = parseInt(clean.replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

/**
 * High-performance, zero-quota YouTube video ID scraper.
 * Fetches public YouTube search results and filters for videos with >= minViews (default: 10,000 views).
 */
export const scrapeYouTubeVideoId = async (query, minViews = 10000) => {
    try {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const html = await res.text();

        // Regex matches videoId and simpleText view counts from videoRenderer blocks
        const regex = /"videoId":"([a-zA-Z0-9_-]{11})".*?"viewCountText":\{.*?"simpleText":"([^"]+)"/g;
        let match;
        let firstFallbackId = null;

        while ((match = regex.exec(html)) !== null) {
            const videoId = match[1];
            const viewText = match[2];
            const views = parseYouTubeViews(viewText);

            if (!firstFallbackId) firstFallbackId = videoId;

            if (views >= minViews) {
                console.log(`[YouTube Scraper] Qualified "${videoId}" (${views.toLocaleString()} views >= ${minViews})`);
                return videoId;
            } else {
                console.log(`[YouTube Scraper] Filtered out "${videoId}" (${views.toLocaleString()} views < ${minViews})`);
            }
        }

        // Secondary fallback if structured view regex didn't hit
        if (!firstFallbackId) {
            const fallbackMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            firstFallbackId = fallbackMatch ? fallbackMatch[1] : null;
        }

        return firstFallbackId;
    } catch (err) {
        return null;
    }
};

/**
 * Searches YouTube for a song and returns metadata formatted like a Spotify track object.
 * Enforces a strict filter for videos with at least 10,000 views (minViews).
 */
export const searchYouTube = async (query, retryCount = 0, minViews = 10000) => {
    try {
        const youtube = rotator.getInstance();
        if (!youtube) {
            console.log(`[YouTube] No API keys configured. Using zero-quota scraper for "${query}" with >= ${minViews} views...`);
            const scrapedId = await scrapeYouTubeVideoId(query, minViews);
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

        console.log(`[YouTube] 🔍 Searching (Key ${rotator.currentIndex}): "${query}" (Min Views: ${minViews})`);
        
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 5,         // Fetch top 5 candidates to allow view count filtering
            type: ['video'],
            videoCategoryId: '10', // Music category
            order: 'viewCount',    // Ensures the most popular video is ranked first
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.warn(`[YouTube] 0 results for: "${query}". Attempting scraper fallback...`);
            const scrapedId = await scrapeYouTubeVideoId(query, minViews);
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

        const candidateIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
        let selectedVideo = response.data.items[0];

        // Fetch statistics to ensure video has at least minViews (10,000)
        try {
            const statsRes = await youtube.videos.list({
                part: ['statistics', 'snippet'],
                id: candidateIds
            });

            const qualifiedVideos = (statsRes.data?.items || []).filter(item => {
                const views = parseInt(item.statistics?.viewCount || '0', 10);
                return views >= minViews;
            });

            if (qualifiedVideos.length > 0) {
                const topQualified = qualifiedVideos[0];
                console.log(`[YouTube] Selected qualified video "${topQualified.snippet.title}" with ${parseInt(topQualified.statistics.viewCount, 10).toLocaleString()} views.`);
                selectedVideo = {
                    id: { videoId: topQualified.id },
                    snippet: topQualified.snippet
                };
            } else {
                console.warn(`[YouTube] None of API candidates reached ${minViews} views. Trying scraper fallback...`);
                const scrapedId = await scrapeYouTubeVideoId(query, minViews);
                if (scrapedId) {
                    selectedVideo.id.videoId = scrapedId;
                }
            }
        } catch (statsErr) {
            console.warn('[YouTube] Failed to verify statistics, using default ranking:', statsErr.message);
        }

        const video = selectedVideo;
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
                images: [{ url: snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${video.id.videoId}/hqdefault.jpg` }]
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
        const isQuotaError = error.code === 403 || (error.errors && error.errors[0]?.reason === 'quotaExceeded') || error.message.toLowerCase().includes('quota');

        if (isQuotaError) {
            console.warn(`[YouTube] Key ${rotator.currentIndex} Quota Exceeded. Rotating or falling back to scraper...`);
            
            if (rotator.rotate() && retryCount < rotator.keys.length) {
                return await searchYouTube(query, retryCount + 1, minViews);
            }

            console.log(`[YouTube] Fallback to zero-quota scraper for "${query}" (>= ${minViews} views)...`);
            const scrapedId = await scrapeYouTubeVideoId(query, minViews);
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
 * Searches YouTube for multiple songs with a minimum 10,000 views requirement (Swipe Feed).
 */
export const searchYouTubeMultiple = async (query, limit = 5, retryCount = 0, minViews = 10000) => {
    try {
        const youtube = rotator.getInstance();
        if (!youtube) return [];
        
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 50,
            type: ['video'],
            videoCategoryId: '10',
            order: 'viewCount'
        });

        if (!response.data.items || response.data.items.length === 0) return [];

        const candidateIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
        let qualifiedItems = response.data.items;

        // Fetch statistics to filter out tracks with < minViews
        try {
            const statsRes = await youtube.videos.list({
                part: ['statistics'],
                id: candidateIds
            });

            const viewsMap = new Map();
            (statsRes.data?.items || []).forEach(item => {
                viewsMap.set(item.id, parseInt(item.statistics?.viewCount || '0', 10));
            });

            const filtered = response.data.items.filter(video => {
                const views = viewsMap.get(video.id?.videoId) ?? 0;
                return views >= minViews;
            });

            if (filtered.length > 0) {
                console.log(`[YouTube Multiple] Filtered ${filtered.length}/${response.data.items.length} videos meeting >= ${minViews} views requirement.`);
                qualifiedItems = filtered;
            }
        } catch (statsErr) {
            console.warn('[YouTube Multiple] Batch stats verification skipped:', statsErr.message);
        }

        // Shuffle the qualified results so feed stays fresh
        const shuffled = qualifiedItems.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, limit);

        return selected.map(video => {
            const snippet = video.snippet;
            const cleanTitle = snippet.title.replace(/\(Official.*?\)/gi, '').replace(/\[Official.*?\]/gi, '').trim();
            return {
                id: video.id.videoId,
                videoId: video.id.videoId,
                name: cleanTitle,
                artists: [{ name: snippet.channelTitle.replace(' - Topic', '') }],
                album: { name: "YouTube Music", images: [{ url: snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${video.id.videoId}/hqdefault.jpg` }] },
                duration_ms: 180000,
                external_urls: { spotify: `https://www.youtube.com/watch?v=${video.id.videoId}` },
                is_youtube: true
            };
        });
    } catch (error) {
        const isQuotaError = error.code === 403 || error.message.toLowerCase().includes('quota');
        if (isQuotaError && rotator.rotate() && retryCount < rotator.keys.length) {
            return await searchYouTubeMultiple(query, limit, retryCount + 1, minViews);
        }
        return [];
    }
};
