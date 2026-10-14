import express from 'express';
import { initSpotifyApi } from '../middleware/spotifyAuth.js';

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

// Create playlist and add tracks
router.post('/playlist', initSpotifyApi, async (req, res) => {
    const { name, trackUris = [], tracks = [], coverImageUrl } = req.body;

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
        // 1. Create Playlist on User Account
        const playlistName = (name || 'VibeMixer Playlist').trim();
        console.log(`[Spotify Route] Creating playlist "${playlistName}"...`);
        const createData = await req.spotifyApi.createPlaylist(playlistName, {
            description: 'Curated with VibeMixer AI Vibe DJ',
            public: false
        });
        const playlistId = createData.body.id;
        console.log(`[Spotify Route] Playlist created with ID: ${playlistId}`);

        // 2. Resolve & Strictly Sanitize Track URIs
        const resolvedUris = [];
        const seenUris = new Set();

        for (const item of trackItems) {
            const uri = typeof item === 'string' ? item : item.uri;
            const id = typeof item === 'object' ? item.id : null;
            const trackName = typeof item === 'object' ? item.name : '';
            const artistName = typeof item === 'object' ? (item.artist || item.artists?.[0]?.name || '') : '';

            // A. Direct valid 22-char Spotify Track URI
            if (typeof uri === 'string' && /^spotify:track:[0-9A-Za-z]{22}$/.test(uri)) {
                if (!seenUris.has(uri)) {
                    seenUris.add(uri);
                    resolvedUris.push(uri);
                }
                continue;
            }

            // B. Direct valid 22-char Spotify ID
            if (typeof id === 'string' && /^[0-9A-Za-z]{22}$/.test(id)) {
                const constructedUri = `spotify:track:${id}`;
                if (!seenUris.has(constructedUri)) {
                    seenUris.add(constructedUri);
                    resolvedUris.push(constructedUri);
                }
                continue;
            }

            // C. Search URI or Track Metadata fallback
            let searchQuery = '';
            if (typeof uri === 'string' && uri.startsWith('spotify:search:')) {
                searchQuery = decodeURIComponent(uri.replace('spotify:search:', '')).trim();
            } else if (trackName) {
                searchQuery = `${trackName} ${artistName}`.trim();
            }

            if (searchQuery) {
                try {
                    const searchRes = await req.spotifyApi.searchTracks(searchQuery, { limit: 1 });
                    const found = searchRes.body?.tracks?.items?.[0];
                    if (found && found.uri && /^spotify:track:[0-9A-Za-z]{22}$/.test(found.uri)) {
                        if (!seenUris.has(found.uri)) {
                            seenUris.add(found.uri);
                            resolvedUris.push(found.uri);
                        }
                    }
                } catch (sErr) {
                    console.warn(`[Spotify Route] Search query "${searchQuery}" failed:`, sErr.message);
                }
            }
        }

        console.log(`[Spotify Route] Resolved ${resolvedUris.length} authentic Spotify tracks.`);

        // 3. Add Tracks in Chunks of 50 (Spotify limit is 100 per call)
        if (resolvedUris.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < resolvedUris.length; i += chunkSize) {
                const chunk = resolvedUris.slice(i, i + chunkSize);
                await req.spotifyApi.addTracksToPlaylist(playlistId, chunk);
            }
            console.log(`[Spotify Route] Added ${resolvedUris.length} tracks to playlist.`);
        }

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
                console.warn('[Spotify Route] Cover image upload bypassed:', imgErr.message);
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
        res.json(result);
    } catch (error) {
        // Check for 401 Unauthorized
        const isAuthError = error.statusCode === 401 || (error.body && error.body.error && error.body.error.status === 401);

        if (isAuthError) {
            console.log('[Spotify Route] 401 encountered. Refreshing token and retrying...');
            try {
                // Attempt to refresh the token using the middleware helper
                if (req.refreshSpotifyToken) {
                    await req.refreshSpotifyToken();
                    // Retry operation with new token (req.spotifyApi is updated inv-place)
                    const result = await performPlaylistCreation();
                    return res.json(result);
                } else {
                    throw new Error('Refresh capability not available');
                }
            } catch (retryError) {
                console.error('[Spotify Route] Retry failed:', retryError);
                return res.status(401).json({ error: 'Session expired. Please login again.' });
            }
        }

        console.error('Error creating playlist:', error);
        res.status(500).json({ error: 'Failed to create playlist' });
    }
});

export default router;
