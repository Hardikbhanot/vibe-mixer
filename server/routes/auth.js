import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'ugc-image-upload',
];

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Fake success for security
            return res.json({ message: 'If that email exists, we sent a link.' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 Hour

        await prisma.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Email Link
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetLink = `${clientUrl}/auth/reset-password?token=${resetToken}`;

        // Send Email (or Log)
        // Send Email (or Log)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: '"VibeMixer Security" <no-reply@vibemixer.tech>',
                    to: email,
                    subject: 'Reset Your VibeMixer Password',
                    html: `<p>You requested a password reset.</p><p>Click here: <a href="${resetLink}">${resetLink}</a></p>`
                });
                console.log(`[Forgot Password] Email sent to ${email}`);
            } catch (emailError) {
                console.error('[Forgot Password] Email sending failed (Bad Credentials?):', emailError.message);
                console.log(`[Forgot Password] FALLBACK LINK: ${resetLink}`);
            }
        } else {
            console.log(`[Forgot Password] Env vars missing. Link: ${resetLink}`);
        }

        res.json({ message: 'If that email exists, we sent a link.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error', details: error.message, stack: error.toString() });
    }
});

// 2. Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// --- Standard Auth (Email/Password) ---

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const hasNumber = /\d/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);

        if (!hasNumber || !hasUpper || !hasLower) {
            return res.status(400).json({ error: 'Password must contain at least one number, one uppercase letter, and one lowercase letter' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword
            }
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? '.vibemixer.hbhanot.tech' : undefined;

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email }, token });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? '.vibemixer.hbhanot.tech' : undefined;

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        res.json({ message: 'Login successful', user: { id: user.id, email: user.email }, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Check Auth Status
router.get('/me', async (req, res) => {
    let token = req.cookies.auth_token;
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'bearer')) {
            token = parts[1];
        }
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, username: true, avatarUrl: true }
        });
        if (!user) return res.status(401).json({ error: 'User not found' });
        const hasSpotify = !!(req.cookies.spotify_access_token || req.cookies.spotify_refresh_token || req.headers['x-spotify-token']);
        const hasGoogle = !!(req.cookies.google_access_token || req.cookies.google_refresh_token || req.headers['x-google-token']);
        res.json({ user: { ...user, hasSpotify, hasGoogle } });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none'
    });
    res.json({ message: 'Logged out successfully' });
});

// Route to initiate login
router.get('/login', (req, res) => {
    console.log('[Spotify Auth] /login called.');
    console.log('[Spotify Auth] Query Params:', req.query);
    const platform = req.query.platform || 'web';
    const redirect = req.query.redirect || null;
    const userId = req.query.userId || null;
    const next = req.query.next || redirect || null;
    let origin = req.query.origin || null;
    if (!origin && req.headers.referer) {
        try { origin = new URL(req.headers.referer).origin; } catch (e) {}
    }
    console.log(`[Spotify Auth] Initiating for Platform: ${platform}, Next: ${next}, Origin: ${origin}, Redirect: ${redirect}`);

    const state = Buffer.from(JSON.stringify({ platform, next, origin, redirect, userId })).toString('base64');
    console.log('[Spotify Auth] Generated State:', state);

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state, true);
    res.redirect(authorizeURL);
});

// Callback route
router.get('/callback', async (req, res) => {
    console.log('!!! SPOTIFY CALLBACK HIT !!!');
    const { code } = req.query;

    let stateData = null;
    if (req.query.state) {
        try {
            stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        } catch (e) {
            console.error('[Spotify Auth] Failed to parse initial state:', e);
        }
    }

    try {
        console.log('[Spotify Callback] Code received. Exchanging for token...');
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;

        let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        console.log('[Spotify Callback] Success via Spotify API');
        console.log('------------------------------------------------');
        console.log('🔑 YOUR SPOTIFY REFRESH TOKEN (Copy to .env):');
        console.log(refresh_token);
        console.log('------------------------------------------------');

        // Fetch User Profile from Spotify to link/create account
        spotifyApi.setAccessToken(access_token);
        const me = await spotifyApi.getMe();
        const spotifyEmail = me.body.email;
        const spotifyId = me.body.id;

        console.log(`[Spotify Auth] Linked to Spotify User: ${spotifyEmail} (${spotifyId})`);

        if (!spotifyEmail) {
            throw new Error('Spotify did not return an email address');
        }

        // --- Fetch Vibe Data (Top Artists/Tracks) ---
        let topArtistsData = [];
        let topTracksData = [];

        try {
            const topArtists = await spotifyApi.getMyTopArtists({ limit: 20, time_range: 'medium_term' });
            topArtistsData = topArtists.body.items.map(artist => ({
                id: artist.id,
                name: artist.name,
                image: artist.images[0]?.url,
                genres: artist.genres
            }));

            const topTracks = await spotifyApi.getMyTopTracks({ limit: 20, time_range: 'medium_term' });
            topTracksData = topTracks.body.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                image: track.album.images[0]?.url
            }));
            console.log(`[Spotify Auth] Fetched ${topArtistsData.length} artists and ${topTracksData.length} tracks.`);
        } catch (dataErr) {
            console.error('[Spotify Auth] Failed to fetch top data:', dataErr);
            // Non-blocking, continue login
        }

        // Find or Create User & Update Vibe Data
        let user = null;
        if (stateData && stateData.userId) {
            user = await prisma.user.findUnique({ where: { id: stateData.userId } });
            if (user) console.log(`[Spotify Auth] Preserving existing logged-in user: ${user.id} (${user.email})`);
        }
        if (!user) {
            user = await prisma.user.findUnique({ where: { email: spotifyEmail } });
        }

        if (!user) {
            console.log('[Spotify Auth] Creating new user from Spotify...');
            const placeholderPassword = await bcrypt.hash(`spotify_${spotifyId}_${Date.now()}`, 10);
            user = await prisma.user.create({
                data: {
                    email: spotifyEmail,
                    password_hash: placeholderPassword,
                    topArtists: topArtistsData,
                    topTracks: topTracksData
                }
            });
        } else {
            console.log('[Spotify Auth] Updating user vibe data...');
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    topArtists: topArtistsData,
                    topTracks: topTracksData
                }
            });
        }

        // Generate App Session Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        const isProduction = process.env.NODE_ENV === 'production';

        const domain = isProduction ? '.vibemixer.hbhanot.tech' : undefined;

        // Set Auth Token Cookie (Critical for app login)
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction ? true : false, // Secure only in prod
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax', // None requires Secure
            domain: domain
        });

        // Set Spotify tokens in cookies
        res.cookie('spotify_access_token', access_token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            maxAge: expires_in * 1000,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        res.cookie('spotify_refresh_token', refresh_token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        // Redirect based on platform
        console.log('[Spotify Auth] Callback State:', stateData);

        if (stateData) {
            try {
                if (stateData.platform === 'mobile') {
                    const targetRedirect = stateData.redirect || stateData.next || 'vibemixer://auth-callback';
                    const sep = targetRedirect.includes('?') ? '&' : '?';
                    const mobileRedirectUrl = `${targetRedirect}${sep}auth_token=${token}&spotify_access_token=${access_token}&spotify_refresh_token=${refresh_token}`;
                    console.log('[Spotify Auth] Redirecting to Mobile App Scheme/Target:', mobileRedirectUrl);
                    return res.redirect(mobileRedirectUrl);
                }

                if (stateData.origin && (stateData.origin.includes('localhost') || stateData.origin.includes('vibemixer') || stateData.origin.includes('127.0.0.1'))) {
                    clientUrl = stateData.origin;
                }

                if (stateData.next) {
                    const target = stateData.next.startsWith('/') ? stateData.next : `/${stateData.next}`;
                    const sep = target.includes('?') ? '&' : '?';
                    console.log(`[Spotify Auth] Preserving user flow: redirecting back to ${clientUrl}${target}${sep}spotify_connected=true`);
                    return res.redirect(`${clientUrl}${target}${sep}spotify_connected=true`);
                }
            } catch (e) {
                console.error('[Spotify Auth] Failed to handle state redirect:', e);
            }
        } else {
            console.log('[Spotify Auth] No state parameter found in callback query.');
        }

        // Default Web Redirect
        console.log('[Spotify Auth] Fallback: Defaulting to Web Redirect (CLIENT_URL).');
        res.redirect(`${clientUrl}/generate`);
    } catch (error) {
        console.error('Error during Spotify authentication:', error);
        let fallbackUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        if (stateData) {
            try {
                if (stateData.platform === 'mobile') {
                    const target = stateData.redirect || stateData.next || 'vibemixer://auth-callback';
                    const sep = target.includes('?') ? '&' : '?';
                    return res.redirect(`${target}${sep}error=spotify_auth_failed`);
                }
                if (stateData.origin) fallbackUrl = stateData.origin;
            } catch (e) {}
        }
        res.redirect(`${fallbackUrl}/results?error=auth_failed`);
    }
});

const getGoogleRedirectUri = () => {
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:4000/auth/google/callback';

    // Auto-fix common configuration error where /auth/ prefix is missing
    if (!redirectUri.includes('/auth/google/callback') && redirectUri.includes('/google/callback')) {
        console.warn(`[Google Auth] Warning: GOOGLE_REDIRECT_URI (${redirectUri}) appears to be missing '/auth' prefix. Auto-correcting...`);
        redirectUri = redirectUri.replace('/google/callback', '/auth/google/callback');
    }
    return redirectUri;
};

// --- Google / YouTube Auth ---

router.get('/google', (req, res) => {
    console.log('[Google Auth] Initiating...');
    console.log('[Google Auth] Client ID:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'MISSING');
    const redirectUri = getGoogleRedirectUri();
    console.log('[Google Auth] Redirect URI:', redirectUri);

    const scopes = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const platform = req.query.platform || 'web';
    const redirect = req.query.redirect || null;
    const userId = req.query.userId || null;
    const next = req.query.next || redirect || null;
    let origin = req.query.origin || null;
    if (!origin && req.headers.referer) {
        try { origin = new URL(req.headers.referer).origin; } catch (e) {}
    }
    const state = Buffer.from(JSON.stringify({ platform, next, origin, redirect, userId })).toString('base64');

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

    console.log('[Google Auth] Generated URL:', url);

    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const code = req.query.code || null;

    let fallbackClientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
    let stateData = null;
    if (req.query.state) {
        try {
            stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
            if (stateData.origin) fallbackClientUrl = stateData.origin;
        } catch (e) {
            console.error('[Google Auth] Failed to parse initial state:', e);
        }
    }

    if (!code) {
        return res.redirect(`${fallbackClientUrl}/results?error=google_auth_failed`);
    }

    try {
        const redirectUri = getGoogleRedirectUri();
        console.log('[Google Auth Callback] Using normalized redirect_uri:', redirectUri);
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('Google Token Error:', data);
            return res.redirect(`${fallbackClientUrl}/results?error=google_token_error`);
        }

        const { access_token, refresh_token, expires_in } = data;

        // Fetch User Profile from Google
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const userProfile = await userRes.json();
        const googleEmail = userProfile.email;
        const googleId = userProfile.id;

        console.log(`[Google Auth] Linked to Google User: ${googleEmail} (${googleId})`);

        if (!googleEmail) {
            throw new Error('Google did not return an email address');
        }

        // Find or Create User
        let user = null;
        if (stateData && stateData.userId) {
            user = await prisma.user.findUnique({ where: { id: stateData.userId } });
            if (user) console.log(`[Google Auth] Preserving existing logged-in user: ${user.id} (${user.email})`);
        }
        if (!user) {
            user = await prisma.user.findUnique({ where: { email: googleEmail } });
        }

        if (!user) {
            console.log('[Google Auth] Creating new user from Google...');
            const placeholderPassword = await bcrypt.hash(`google_${googleId}_${Date.now()}`, 10);
            user = await prisma.user.create({
                data: {
                    email: googleEmail,
                    password_hash: placeholderPassword
                }
            });
        }

        // Generate App Session Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        const isProduction = process.env.NODE_ENV === 'production';
        const domain = isProduction ? '.vibemixer.hbhanot.tech' : undefined;

        // Set Auth Token Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        // Set tokens in cookies
        res.cookie('google_access_token', access_token, {
            httpOnly: true,
            secure: isProduction ? true : false,
            maxAge: expires_in * 1000,
            path: '/',
            sameSite: isProduction ? 'none' : 'lax',
            domain: domain
        });

        if (refresh_token) {
            res.cookie('google_refresh_token', refresh_token, {
                httpOnly: true,
                secure: isProduction ? true : false,
                path: '/',
                sameSite: isProduction ? 'none' : 'lax',
                domain: domain
            });
        }

        // Redirect based on platform
        console.log('[Google Auth] Callback State:', stateData);

        if (stateData) {
            try {
                if (stateData.platform === 'mobile') {
                    const targetRedirect = stateData.redirect || stateData.next || 'vibemixer://auth-callback';
                    const sep = targetRedirect.includes('?') ? '&' : '?';
                    const mobileRedirectUrl = `${targetRedirect}${sep}auth_token=${token}&google_access_token=${access_token}&google_refresh_token=${refresh_token || ''}`;
                    console.log('[Google Auth] Redirecting to Mobile App Scheme/Target:', mobileRedirectUrl);
                    return res.redirect(mobileRedirectUrl);
                }

                let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                if (stateData.origin && (stateData.origin.includes('localhost') || stateData.origin.includes('vibemixer') || stateData.origin.includes('127.0.0.1'))) {
                    clientUrl = stateData.origin;
                }

                if (stateData.next) {
                    const target = stateData.next.startsWith('/') ? stateData.next : `/${stateData.next}`;
                    const sep = target.includes('?') ? '&' : '?';
                    console.log(`[Google Auth] Preserving user flow: redirecting back to ${clientUrl}${target}${sep}google_connected=true`);
                    return res.redirect(`${clientUrl}${target}${sep}google_connected=true`);
                }
            } catch (e) {
                console.error('[Google Auth] Failed to parse state:', e, 'Raw State:', req.query.state);
            }
        } else {
            console.log('[Google Auth] No state parameter found in callback query.');
        }

        // Web Redirect
        console.log('[Google Auth] Fallback: Defaulting to Web Redirect.');
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/generate`);

    } catch (error) {
        console.error('Google Auth Error:', error);
        let fallbackUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        if (stateData) {
            try {
                if (stateData.platform === 'mobile') {
                    const target = stateData.redirect || stateData.next || 'vibemixer://auth-callback';
                    const sep = target.includes('?') ? '&' : '?';
                    return res.redirect(`${target}${sep}error=google_auth_failed`);
                }
                if (stateData.origin) fallbackUrl = stateData.origin;
            } catch (e) {}
        }
        res.redirect(`${fallbackUrl}/results?error=server_error`);
    }
});

export default router;
