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
    let refreshToken = req.cookies.google_refresh_token || req.headers['x-google-refresh-token'];

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

    // Always provide both tokens so googleapis can automatically refresh if needed
    oauth2Client.setCredentials({ 
        access_token: accessToken || undefined,
        refresh_token: refreshToken || undefined
    });

    // Listen for automatic token refreshes by the googleapis client
    oauth2Client.on('tokens', (tokens) => {
        if (tokens.access_token) {
            accessToken = tokens.access_token;
            res.cookie('google_access_token', tokens.access_token, {
                httpOnly: true,
                secure: isProduction,
                maxAge: tokens.expiry_date ? Math.max(tokens.expiry_date - Date.now(), 60000) : 3600 * 1000,
                path: '/',
                sameSite: isProduction ? 'none' : 'lax',
                domain: domain
            });
        }
        if (tokens.refresh_token) {
            refreshToken = tokens.refresh_token;
            res.cookie('google_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                path: '/',
                sameSite: isProduction ? 'none' : 'lax',
                domain: domain
            });
        }
    });

    if (!accessToken && refreshToken) {
        try {
            console.log('[YouTube Auth] Access token missing, refreshing from refresh token...');
            const { credentials } = await oauth2Client.refreshAccessToken();
            accessToken = credentials.access_token;
            oauth2Client.setCredentials(credentials);

            res.cookie('google_access_token', accessToken, {
                httpOnly: true,
                secure: isProduction,
                maxAge: credentials.expiry_date ? Math.max(credentials.expiry_date - Date.now(), 60000) : 3600 * 1000,
                path: '/',
                sameSite: isProduction ? 'none' : 'lax',
                domain: domain
            });
        } catch (error) {
            console.error('Google Token Refresh Error:', error);
            return res.status(401).json({ error: 'Session expired', needsLogin: true });
        }
    }

    req.oauth2Client = oauth2Client;
    req.youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    next();
};

// Create Playlist and Add Tracks
router.post('/playlist', initYoutubeClient, async (req, res) => {
    const { name, description, tracks, isPublic } = req.body;

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: 'At least one track is required to create a YouTube playlist.' });
    }

    try {
        // 1. Resolve Video IDs FIRST with high-concurrency parallel resolution
        console.log(`[YouTube Route] Resolving video IDs for ${tracks.length} tracks...`);
        const resolveTrackVideoId = async (track) => {
            // Check if track already has an authentic 11-char videoId
            if (track.videoId && /^[a-zA-Z0-9_-]{11}$/.test(track.videoId)) {
                return track.videoId;
            }
            if (track.external_urls?.youtube) {
                const match = track.external_urls.youtube.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
                    return match[1];
                }
            }

            const artistName = track.artist || track.artists?.[0]?.name || '';
            const query = `${track.name || ''} ${artistName} Official Audio`.trim();

            // Priority A: Zero-quota scraper with 10k view verification (<200ms)
            try {
                const scrapedId = await scrapeYouTubeVideoId(query, 10000);
                if (scrapedId && /^[a-zA-Z0-9_-]{11}$/.test(scrapedId)) {
                    return scrapedId;
                }
            } catch (sErr) {}

            // Priority B: User Google OAuth Search with >=10k views check
            try {
                const searchRes = await req.youtube.search.list({
                    part: ['snippet'],
                    q: query,
                    maxResults: 3,
                    type: ['video'],
                    order: 'viewCount'
                });
                const items = searchRes.data?.items || [];
                const candidateIds = items.map(i => i.id?.videoId).filter(Boolean);

                if (candidateIds.length > 0) {
                    const statsRes = await req.youtube.videos.list({
                        part: ['statistics'],
                        id: candidateIds
                    });
                    const qualified = (statsRes.data?.items || []).find(v => parseInt(v.statistics?.viewCount || '0', 10) >= 10000);
                    if (qualified?.id) {
                        return qualified.id;
                    }
                }
            } catch (userSearchErr) {
                // Priority C: Centralized Rotator API Keys
                try {
                    const fallbackTrack = await searchYouTube(query, 0, 10000);
                    if (fallbackTrack?.id && /^[a-zA-Z0-9_-]{11}$/.test(fallbackTrack.id)) {
                        return fallbackTrack.id;
                    }
                } catch (rotatorErr) {}
            }

            return null;
        };

        const resolvedIds = await Promise.all(tracks.map(t => resolveTrackVideoId(t)));
        const videoIds = resolvedIds.filter(Boolean);

        console.log(`[YouTube Route] Successfully resolved ${videoIds.length}/${tracks.length} video IDs`);

        if (videoIds.length === 0) {
            return res.status(422).json({
                error: 'Could not resolve playable videos for the given tracks. Playlist creation aborted to avoid empty playlist.',
                videoCount: 0
            });
        }

        // 2. Create Playlist on User's YouTube Channel
        // IMPORTANT: 'unlisted' allows anyone with the direct link to immediately view and play the playlist.
        // 'private' causes YouTube to display "The playlist does not exist." unless viewed inside YouTube Studio!
        const requestedPrivacy = isPublic === true ? 'public' : 'unlisted';
        const playlistTitle = (name || 'My VibeMixer Playlist').trim();
        console.log(`[YouTube Route] Creating playlist: "${playlistTitle}" (${requestedPrivacy}) for ${videoIds.length} videos`);

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
                        privacyStatus: requestedPrivacy,
                    },
                },
            });
        } catch (insertErr) {
            console.warn(`[YouTube Route] Playlist insert with ${requestedPrivacy} status failed: ${insertErr.message}, attempting unlisted/private fallback...`);
            try {
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
            } catch (unlistedErr) {
                console.warn('[YouTube Route] Unlisted insert failed, falling back to private:', unlistedErr.message);
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
            }
        }

        const playlistId = playlistRes.data.id;
        console.log(`[YouTube Route] Playlist created: ${playlistId} (status: ${playlistRes.data.status?.privacyStatus})`);
        console.log(`[YouTube Route] Adding ${videoIds.length} videos to playlist ${playlistId}...`);

        // 3. Add videos to playlist
        let insertedCount = 0;
        for (const videoId of videoIds) {
            try {
                const itemRes = await req.youtube.playlistItems.insert({
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
                insertedCount++;
                console.log(`[YouTube Route] Inserted video ${videoId} (item: ${itemRes.data?.id})`);
            } catch (err) {
                console.warn(`[YouTube Route] Failed to insert video ${videoId}:`, err.message);
                // In case of token expiration midway through insertions, refresh and retry once
                if (err.code === 401 && req.oauth2Client) {
                    try {
                        const { credentials } = await req.oauth2Client.refreshAccessToken();
                        req.oauth2Client.setCredentials(credentials);
                        const retryRes = await req.youtube.playlistItems.insert({
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
                        insertedCount++;
                        console.log(`[YouTube Route] Retry succeeded for video ${videoId} (item: ${retryRes.data?.id})`);
                    } catch (retryErr) {
                        console.warn(`[YouTube Route] Retry insert failed for video ${videoId}:`, retryErr.message);
                    }
                }
            }
        }

        console.log(`[YouTube Route] Inserted ${insertedCount}/${videoIds.length} videos into playlist ${playlistId}`);

        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        res.json({
            success: true,
            message: `YouTube Playlist created with ${insertedCount} tracks`,
            playlistUrl: playlistUrl,
            playlistId: playlistId,
            videoCount: insertedCount,
            privacyStatus: playlistRes.data.status?.privacyStatus || requestedPrivacy
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

function parseIsoDuration(duration) {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2] || '0', 10);
    const secs = parseInt(match[3] || '0', 10);
    return hours * 3600 + mins * 60 + secs;
}

// Search for Regional Vibe (AI Optimized Search - Strictly NO Shorts)
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

        // 2. Search YouTube with explicit anti-shorts query
        const refinedQuery = `${searchQuery} official full song audio -shorts -tiktok -reels`.trim();
        console.log(`[Region Vibe] Searching YouTube with query: "${refinedQuery}"`);

        const searchRes = await youtube.search.list({
            part: ['snippet'],
            q: refinedQuery,
            maxResults: 25, 
            type: 'video',
        });

        if (searchRes.data.items && searchRes.data.items.length > 0) {
            // Strict banned keywords: shorts, reels, status, mashups, compilations
            const bannedWords = [
                '#shorts', '#short', 'shorts', 'short', 'reels', 'tiktok',
                'status', 'whatsapp status', 'short video',
                'mashup', 'jukebox', 'nonstop', 'collection', 'compilation'
            ];

            const candidateItems = searchRes.data.items.filter(item => {
                const title = (item.snippet.title || '').toLowerCase();
                const desc = (item.snippet.description || '').toLowerCase();
                const hasBannedWord = bannedWords.some(word => title.includes(word) || desc.includes(word));
                return !hasBannedWord && item.id?.videoId;
            });

            const candidateIds = candidateItems.map(i => i.id.videoId);

            // Fetch video details to verify duration (strictly filter out shorts < 75s)
            let qualifiedVideos = [];
            if (candidateIds.length > 0) {
                try {
                    const videoDetailsRes = await youtube.videos.list({
                        part: ['contentDetails', 'snippet', 'statistics'],
                        id: candidateIds
                    });
                    
                    const detailsItems = videoDetailsRes.data?.items || [];
                    qualifiedVideos = detailsItems.filter(v => {
                        const durationSec = parseIsoDuration(v.contentDetails?.duration);
                        const title = (v.snippet?.title || '').toLowerCase();
                        const desc = (v.snippet?.description || '').toLowerCase();

                        // Must be at least 75 seconds long (strictly NO YouTube shorts)
                        const isNotShort = durationSec >= 75;
                        const hasNoShortTag = !title.includes('#short') && !desc.includes('#short') && !title.includes('shorts');
                        
                        return isNotShort && hasNoShortTag;
                    }).map(v => ({
                        id: v.id,
                        title: v.snippet.title,
                        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
                        channelTitle: v.snippet.channelTitle,
                        durationSec: parseIsoDuration(v.contentDetails?.duration)
                    }));
                } catch (vErr) {
                    console.warn('[Region Vibe] Could not fetch detailed video durations:', vErr.message);
                }
            }

            // Fallback to candidates if video details failed
            if (qualifiedVideos.length === 0) {
                qualifiedVideos = candidateItems.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                    channelTitle: item.snippet.channelTitle
                }));
            }

            // Limit to 10 verified full songs
            return res.json({ videos: qualifiedVideos.slice(0, 10) });
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
