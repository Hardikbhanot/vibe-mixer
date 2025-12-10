import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

export const initSpotifyApi = async (req, res, next) => {
    console.log(`[Auth Middleware] Processing request for ${req.path}`);
    console.log('[Auth Middleware] Cookies:', req.cookies);

    let accessToken = req.cookies.spotify_access_token;
    const refreshToken = req.cookies.spotify_refresh_token;

    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: refreshToken,
    });

    // Helper: Refresh Token Function attached to Request for routes to use
    req.refreshSpotifyToken = async () => {
        if (!refreshToken) throw new Error('No refresh token available');
        try {
            console.log('[Auth Middleware] Force refreshing token...');

            // Ensure refresh token is set on the API object
            spotifyApi.setRefreshToken(refreshToken);

            const data = await spotifyApi.refreshAccessToken();
            const newAccessToken = data.body['access_token'];
            const expiresIn = data.body['expires_in'];

            // Update API instance
            spotifyApi.setAccessToken(newAccessToken);

            // Update Cookie
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('spotify_access_token', newAccessToken, {
                httpOnly: true,
                secure: isProduction ? true : false,
                maxAge: expiresIn * 1000,
                path: '/',
                sameSite: isProduction ? 'none' : 'lax'
            });

            console.log('[Auth Middleware] Token refreshed successfully');
            return newAccessToken;
        } catch (error) {
            console.error('[Auth Middleware] Refresh failed:', error);
            throw error;
        }
    };

    // Case 1: No tokens at all -> Guest Mode
    if (!accessToken && !refreshToken) {
        // ... (Guest Logic - Keep existing)
        console.log('[Auth Middleware] No tokens found - Using Client Credentials Flow (Guest Mode)');
        try {
            const data = await spotifyApi.clientCredentialsGrant();
            const guestAccessToken = data.body['access_token'];

            spotifyApi.setAccessToken(guestAccessToken);
            req.spotifyApi = spotifyApi;
            req.isGuest = true;
            return next();
        } catch (error) {
            console.error('[Auth Middleware] Client Credentials Grant failed:', error);
            return res.status(500).json({ error: 'Failed to initialize Spotify API for guest' });
        }
    }

    // Case 2: Access token missing but have refresh token -> Try refresh
    if (!accessToken && refreshToken) {
        try {
            await req.refreshSpotifyToken();
            req.spotifyApi = spotifyApi;
            req.isGuest = false;
            return next();
        } catch (error) {
            // Fallback to Guest
            console.log('[Auth Middleware] Refresh failed - Falling back to Guest Mode');
            try {
                const data = await spotifyApi.clientCredentialsGrant();
                const guestAccessToken = data.body['access_token'];

                spotifyApi.setAccessToken(guestAccessToken);
                req.spotifyApi = spotifyApi;
                req.isGuest = true;
                return next();
            } catch (ccError) {
                return res.status(401).json({ error: 'Session expired. Please login again.' });
            }
        }
    }

    // Case 3: Have access token (assume valid, but route can refresh if 401)
    if (accessToken) {
        spotifyApi.setAccessToken(accessToken);
        req.spotifyApi = spotifyApi;
        req.isGuest = false;
        next();
    } else {
        res.status(401).json({ error: 'Authentication failed' });
    }
};
