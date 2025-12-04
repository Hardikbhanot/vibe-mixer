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

    // Case 1: No tokens at all
    if (!accessToken && !refreshToken) {
        console.log('[Auth Middleware] No tokens found');
        return res.status(401).json({ error: 'Not authenticated. Please login.' });
    }

    // Case 2: Access token missing but have refresh token -> Try refresh
    if (!accessToken && refreshToken) {
        try {
            console.log('[Auth Middleware] Access token expired, attempting refresh...');
            const data = await spotifyApi.refreshAccessToken();
            accessToken = data.body['access_token'];
            const expiresIn = data.body['expires_in'];

            console.log('[Auth Middleware] Token refreshed successfully');

            // Set new access token in cookie
            res.cookie('spotify_access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: expiresIn * 1000,
                path: '/',
                sameSite: 'lax'
            });
        } catch (error) {
            console.error('[Auth Middleware] Refresh failed:', error);
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }
    }

    // Case 3: Have access token (either existing or refreshed)
    if (accessToken) {
        spotifyApi.setAccessToken(accessToken);
        req.spotifyApi = spotifyApi;
        next();
    } else {
        // Should not happen if logic is correct, but safety net
        res.status(401).json({ error: 'Authentication failed' });
    }
};
