import express from 'express';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Search for tracks
router.post('/search', initSpotifyApi, async (req, res) => {
    const { query } = req.body;

    try {
        const data = await req.spotifyApi.searchTracks(query);
        res.json(data.body.tracks.items);
    } catch (error) {
        console.error('Error searching tracks:', error);
        res.status(500).json({ error: 'Failed to search tracks' });
    }
});

// Helper: Resolve a single track item to an authentic Spotify URI
async function resolveTrackItem(item, req) {
    const uri = typeof item === 'string' ? item : item?.uri;
    const id = typeof item === 'object' ? item?.id : null;
    const trackName = typeof item === 'object' ? (item?.name || item?.title || '') : '';
    const artistName = typeof item === 'object' ? (item?.artist || item?.artists?.[0]?.name || '') : '';

    // A. Direct valid 22-char Spotify Track URI
    if (typeof uri === 'string' && /^spotify:track:[0-9A-Za-z]{22}$/.test(uri)) {
        return uri;
    }

    // B. Direct valid 22-char Spotify ID
    if (typeof id === 'string' && /^[0-9A-Za-z]{22}$/.test(id)) {
        return `spotify:track:${id}`;
    }

    const cleanTitle = trackName ? trackName.split('(')[0].split('[')[0].split('-')[0].trim() : '';
    const cleanArtist = artistName ? artistName.split(',')[0].split('feat.')[0].trim() : '';

    // C. Database Knowledge Lookup (Instant Local RAG)
    if (cleanTitle) {
        try {
            const dbTrack = await prisma.trackKnowledge.findFirst({
                where: {
                    title: { equals: cleanTitle, mode: 'insensitive' },
                    ...(cleanArtist ? { artist: { contains: cleanArtist, mode: 'insensitive' } } : {})
                },
                select: { spotifyUri: true, spotifyId: true }
            });

            if (dbTrack?.spotifyUri && /^spotify:track:[0-9A-Za-z]{22}$/.test(dbTrack.spotifyUri)) {
                return dbTrack.spotifyUri;
            }
            if (dbTrack?.spotifyId && /^[0-9A-Za-z]{22}$/.test(dbTrack.spotifyId)) {
                return `spotify:track:${dbTrack.spotifyId}`;
            }
        } catch (dbErr) {
            // Non-blocking
        }
    }

    // D. Search URI or Track Metadata fallback
    let searchQuery = '';
    if (typeof uri === 'string' && uri.startsWith('spotify:search:')) {
        searchQuery = decodeURIComponent(uri.replace('spotify:search:', '')).trim();
    } else if (cleanTitle) {
        searchQuery = `${cleanTitle} ${cleanArtist}`.trim();
    } else if (trackName) {
        searchQuery = `${trackName} ${artistName}`.trim();
    }

    if (searchQuery) {
        // Priority: Guest Spotify API (Client Credentials Flow - reliable & unrestricted), then User client
        const apis = [req.guestSpotifyApi, req.spotifyApi].filter(Boolean);

        for (const api of apis) {
            try {
                const searchRes = await api.searchTracks(searchQuery, { limit: 1 });
                const found = searchRes.body?.tracks?.items?.[0];
                if (found?.uri && /^spotify:track:[0-9A-Za-z]{22}$/.test(found.uri)) {
                    // Asynchronously cache back to DB for future 0ms lookups
                    if (cleanTitle) {
                        const artistToSave = cleanArtist || found.artists?.[0]?.name || 'Unknown';
                        prisma.trackKnowledge.upsert({
                            where: { title_artist: { title: cleanTitle, artist: artistToSave } },
                            update: {
                                spotifyUri: found.uri,
                                spotifyId: found.id,
                                ...(found.album?.images?.[0]?.url ? { coverImage: found.album.images[0].url } : {}),
                                ...(found.preview_url ? { previewUrl: found.preview_url } : {}),
                                ...(found.duration_ms ? { durationMs: found.duration_ms } : {})
                            },
                            create: {
                                title: cleanTitle,
                                artist: artistToSave,
                                lyrics: '',
                                spotifyUri: found.uri,
                                spotifyId: found.id,
                                coverImage: found.album?.images?.[0]?.url || null,
                                previewUrl: found.preview_url || null,
                                durationMs: found.duration_ms || 210000
                            }
                        }).catch(() => {});
                    }
                    return found.uri;
                }
            } catch (sErr) {
                // Non-blocking, try next client
            }
        }
    }

    return null;
}

// Create playlist and add tracks
router.post('/playlist', initSpotifyApi, async (req, res) => {
    const { name, description, trackUris = [], tracks = [], coverImageUrl } = req.body;

    // Guest mode cannot create playlists on user accounts
    if (req.isGuest) {
        return res.status(401).json({
            error: 'Spotify account not connected. Please login with Spotify to save playlists.',
            needsLogin: true,
            loginUrl: '/auth/login'
        });
    }

    // Combine tracks and trackUris for maximal compatibility
    const trackItems = Array.isArray(tracks) && tracks.length > 0 
        ? tracks 
        : (Array.isArray(trackUris) ? trackUris.map(u => ({ uri: u, name: '', artist: '' })) : []);

    if (trackItems.length === 0) {
        return res.status(400).json({ error: 'At least one track is required to create a playlist.' });
    }

    // Define the operation to allow retry
    const performPlaylistCreation = async () => {
        // 1. Resolve & Strictly Sanitize Track URIs FIRST (in parallel for maximum speed)
        console.log(`[Spotify Route] Resolving ${trackItems.length} track items...`);
        const resolvedList = await Promise.all(trackItems.map(item => resolveTrackItem(item, req)));

        const seenUris = new Set();
        const resolvedUris = [];
        for (const uri of resolvedList) {
            if (uri && !seenUris.has(uri)) {
                seenUris.add(uri);
                resolvedUris.push(uri);
            }
        }

        console.log(`[Spotify Route] Resolved ${resolvedUris.length} of ${trackItems.length} authentic Spotify tracks.`);

        // Critical Safeguard: If NO tracks could be resolved, DO NOT create an empty playlist!
        if (resolvedUris.length === 0) {
            const fallbackErr = new Error(
                'No valid Spotify track URIs could be resolved for this playlist.'
            );
            fallbackErr.statusCode = 422;
            fallbackErr.needsFallback = true;
            fallbackErr.fallback = 'youtube';
            throw fallbackErr;
        }

        // Proactive token check: verify user access token is active before creating playlist
        try {
            await req.spotifyApi.getMe();
        } catch (authErr) {
            const isAuth = authErr.statusCode === 401 || (authErr.body?.error?.status === 401);
            if (isAuth && typeof req.refreshSpotifyToken === 'function') {
                console.log('[Spotify Route] User token expired prior to playlist creation. Refreshing token...');
                await req.refreshSpotifyToken();
            }
        }

        // 2. Create Playlist on User Account ONLY when tracks exist
        const playlistName = (name || 'VibeMixer Playlist').trim();
        const playlistDesc = (description || 'Curated with VibeMixer AI Vibe DJ').trim();
        console.log(`[Spotify Route] Creating playlist "${playlistName}"...`);
        const createData = await req.spotifyApi.createPlaylist(playlistName, {
            description: playlistDesc,
            public: false
        });
        const playlistId = createData.body.id;
        console.log(`[Spotify Route] Playlist created with ID: ${playlistId}`);

        // 3. Add Tracks in Chunks of 50 (Spotify limit is 100 per call)
        const chunkSize = 50;
        for (let i = 0; i < resolvedUris.length; i += chunkSize) {
            const chunk = resolvedUris.slice(i, i + chunkSize);
            await req.spotifyApi.addTracksToPlaylist(playlistId, chunk);
        }
        console.log(`[Spotify Route] Added ${resolvedUris.length} tracks to playlist.`);

        // 4. Safely Upload Cover Image (Optional Enhancement, Never Blocks)
        if (coverImageUrl && typeof coverImageUrl === 'string') {
            try {
                let base64Image = null;

                if (coverImageUrl.startsWith('data:image')) {
                    const parts = coverImageUrl.split(',');
                    if (parts.length > 1) base64Image = parts[1];
                } else if (!coverImageUrl.includes('pollinations.ai')) {
                    // Fetch external image if not slow pollinations
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000);
                    const imageRes = await fetch(coverImageUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (imageRes.ok) {
                        const arrayBuffer = await imageRes.arrayBuffer();
                        if (arrayBuffer.byteLength < 256 * 1024) { // Spotify max 256KB
                            base64Image = Buffer.from(arrayBuffer).toString('base64');
                        }
                    }
                }

                if (base64Image) {
                    await req.spotifyApi.uploadCustomPlaylistCoverImage(playlistId, base64Image);
                    console.log('[Spotify Route] Custom cover image uploaded successfully.');
                }
            } catch (imgErr) {
                console.warn('[Spotify Route] Cover image upload bypassed (non-critical):', imgErr.message);
            }
        }

        const externalUrl = createData.body.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;
        return {
            ...createData.body,
            external_urls: { spotify: externalUrl },
            playlistUrl: externalUrl,
            trackCount: resolvedUris.length
        };
    };

    try {
        const result = await performPlaylistCreation();
        return res.json(result);
    } catch (error) {
        // Check for 401 Unauthorized
        const isAuthError = error.statusCode === 401 || (error.body && error.body.error && error.body.error.status === 401);

        if (isAuthError) {
            console.log('[Spotify Route] 401 encountered. Refreshing token and retrying...');
            try {
                if (req.refreshSpotifyToken) {
                    await req.refreshSpotifyToken();
                    const retryResult = await performPlaylistCreation();
                    return res.json(retryResult);
                } else {
                    throw new Error('Refresh capability not available');
                }
            } catch (retryError) {
                console.error('[Spotify Route] Retry failed:', retryError);
                return res.status(401).json({ error: 'Session expired. Please login again.', needsLogin: true });
            }
        }

        // Check for 422 Unprocessable Entity (Needs Fallback)
        if (error.statusCode === 422 || error.needsFallback) {
            return res.status(422).json({
                error: error.message,
                needsFallback: true,
                fallback: 'youtube',
                message: 'No Spotify tracks could be resolved. Seamlessly switching to YouTube (Tier 2)...',
                trackCount: 0
            });
        }

        console.error('Error creating playlist:', error);
        res.status(500).json({ error: error.message || 'Failed to create playlist' });
    }
});

export default router;
