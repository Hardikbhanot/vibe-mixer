import express from 'express';
import { google } from 'googleapis';
import { getRegionalVibeQuery } from '../services/groq.js';
import { rotator, searchYouTube, scrapeYouTubeVideoId } from '../services/youtube.js';

const router = express.Router();

// Middleware to initialize YouTube API client
const initYoutubeClient = async (req, res, next) => {
    console.log('[YouTube Auth] Checking tokens...');
    // Check Cookies OR Headers (for Mobile)
    let accessToken = req.cookies.google_access_token || req.headers['x-google-token'];
    const refreshToken = req.cookies.google_refresh_token || req.headers['x-google-refresh-token'];

    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? '.vibemixer.hbhanot.tech' : undefined;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:4000/auth/google/callback';

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    if (!accessToken && !refreshToken) {
        return res.status(401).json({ 
            error: 'Not authenticated with Google',
            needsLogin: true,
            loginUrl: '/auth/google'
        });
    }

    if (!accessToken && refreshToken) {
        try {
            console.log('[YouTube Auth] Refreshing token...');
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await oauth2Client.refreshAccessToken();
            accessToken = credentials.access_token;

            res.cookie('google_access_token', accessToken, {
                httpOnly: true,
                secure: isProduction,
                maxAge: (credentials.expiry_date - Date.now()),
                path: '/',
                sameSite: isProduction ? 'none' : 'lax',
                domain: domain
            });
        } catch (error) {
            console.error('Google Token Refresh Error:', error);
            return res.status(401).json({ error: 'Session expired' });
        }
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    req.youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    next();
};

// Create Playlist and Add Tracks
router.post('/playlist', initYoutubeClient, async (req, res) => {
    const { name, description, tracks, coverImage } = req.body;

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: 'At least one track is required to create a YouTube playlist.' });
    }

    try {
        // 1. Resolve Video IDs FIRST to guarantee no empty playlists are created
        const videoIds = [];
        for (const track of tracks) {
            try {
                // Check if track already has a videoId
                let videoId = track.videoId;
                if (!videoId && track.external_urls?.youtube) {
                    const match = track.external_urls.youtube.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    if (match) videoId = match[1];
                }

                if (videoId) {
                    videoIds.push(videoId);
                    continue;
                }

                const artistName = track.artist || track.artists?.[0]?.name || '';
                const query = `${track.name || ''} ${artistName} Official Audio`.trim();

                let foundId = null;

                // Priority A: Zero-quota high-speed scraper (<200ms, unlimited)
                try {
                    foundId = await scrapeYouTubeVideoId(query);
                } catch (sErr) {
                    // Fallthrough to API
                }

                // Priority B: User Google OAuth Search (if scraper returned null)
                if (!foundId) {
                    try {
                        const searchRes = await req.youtube.search.list({
                            part: ['snippet'],
                            q: query,
                            maxResults: 1,
                            type: ['video'],
                        });

                        if (searchRes.data.items && searchRes.data.items.length > 0) {
                            foundId = searchRes.data.items[0].id.videoId;
                        }
                    } catch (userSearchErr) {
                        console.warn(`[YouTube Route] User search quota exhausted for "${track.name}", using rotator:`, userSearchErr.message);
                        const fallbackTrack = await searchYouTube(query);
                        if (fallbackTrack && fallbackTrack.id) {
                            foundId = fallbackTrack.id;
                        }
                    }
                }

                if (foundId) videoIds.push(foundId);
            } catch (err) {
                console.warn(`[YouTube Route] Failed to find video for "${track.name}":`, err.message);
            }
        }

        if (videoIds.length === 0) {
            return res.status(422).json({
                error: 'Could not resolve playable videos for the given tracks. Playlist creation aborted to avoid empty playlist.',
                videoCount: 0
            });
        }

        // 2. Create Playlist on User's YouTube Channel (Use 'private' for unverified OAuth apps)
        const playlistTitle = (name || 'My VibeMixer Playlist').trim();
        console.log(`[YouTube Route] Creating playlist: "${playlistTitle}" for ${videoIds.length} videos`);
        let playlistRes;
        try {
            playlistRes = await req.youtube.playlists.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: playlistTitle,
                        description: description || 'Generated by VibeMixer AI Vibe DJ',
                    },
                    status: {
                        privacyStatus: 'private',
                    },
                },
            });
        } catch (insertErr) {
            console.warn('[YouTube Route] Playlist insert with private status failed, attempting unlisted fallback...', insertErr.message);
            playlistRes = await req.youtube.playlists.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: playlistTitle,
                        description: description || 'Generated by VibeMixer AI Vibe DJ',
                    },
                    status: {
                        privacyStatus: 'unlisted',
                    },
                },
            });
        }

        const playlistId = playlistRes.data.id;
        console.log(`[YouTube Route] Playlist created: ${playlistId}`);

        console.log(`[YouTube Route] Adding ${videoIds.length} videos to playlist ${playlistId}...`);

        // 4. Add videos to playlist
        for (const videoId of videoIds) {
            try {
                await req.youtube.playlistItems.insert({
                    part: ['snippet'],
                    requestBody: {
                        snippet: {
                            playlistId: playlistId,
                            resourceId: {
                                kind: 'youtube#video',
                                videoId: videoId,
                            },
                        },
                    },
                });
            } catch (err) {
                console.warn(`[YouTube Route] Failed to insert video ${videoId}:`, err.message);
            }
        }

        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        res.json({
            success: true,
            message: 'Playlist created successfully',
            playlistUrl: playlistUrl,
            playlistId: playlistId,
            videoCount: videoIds.length
        });

    } catch (error) {
        console.error('YouTube API Error:', error);
        // Extract meaningful error message from Google API response
        const errorDetails = error.response?.data?.error?.message || error.message;
        const reason = error.response?.data?.error?.errors?.[0]?.reason || 'Unknown';

        res.status(500).json({
            error: 'Failed to create YouTube playlist',
            details: errorDetails,
            reason: reason
        });
    }
});

// Search for Regional Vibe (AI Optimized Search)
router.get('/region-vibe', async (req, res) => {
    const { region } = req.query;

    if (!region) {
        return res.status(400).json({ error: 'Region is required' });
    }

    try {
        console.log(`[Region Vibe] Request for region: ${region}`);

        // Use the centralized rotator for quota-aware searching
        const youtube = rotator.getInstance();
        if (!youtube) {
            return res.status(500).json({ error: 'YouTube API not configured' });
        }

        // 1. Get AI Optimized Query
        let searchQuery = `Best ${region} songs india`; 
        try {
            const aiData = await getRegionalVibeQuery(region);
            if (aiData.searchQuery) {
                searchQuery = aiData.searchQuery;
            }
        } catch (e) {
            console.error('AI Curation failed, using default query', e);
        }

        // 2. Search YouTube (Uses Centralized Rotator)
        console.log(`[Region Vibe] Searching YouTube with query: "${searchQuery}"`);

        const searchRes = await youtube.search.list({
            part: ['snippet'],
            q: searchQuery,
            maxResults: 20, 
            type: 'video',
        });

        if (searchRes.data.items.length > 0) {
            // Filter out Mashups, Jukeboxes, and Compilations
            const bannedWords = ['mashup', 'jukebox', 'nonstop', 'collection', 'compilation', 'mix', 'dj'];

            let videos = searchRes.data.items
                .filter(item => {
                    const title = item.snippet.title.toLowerCase();
                    return !bannedWords.some(word => title.includes(word));
                })
                .map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle
                }));

            // If filtering removed too many, fill back up with original results (to ensure we show something)
            if (videos.length < 5) {
                console.log('[Region Vibe] Strict filtering removed too many videos. Relaxing filter.');
                videos = searchRes.data.items.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle
                }));
            }

            // Limit to 10
            return res.json({ videos: videos.slice(0, 10) });
        }

        res.status(404).json({ error: 'No vibe found' });

    } catch (error) {
        console.error('YouTube Search Error:', error);
        // Check for Quota Error specifically
        if (error.code === 403 && error.message.includes('quota')) {
            return res.status(403).json({ error: 'YouTube API Quota Exceeded. Please try again tomorrow.' });
        }
        res.status(500).json({ error: 'Failed to search YouTube', details: error.message });
    }
});

export default router;
