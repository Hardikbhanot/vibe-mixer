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
    'playlist-modify-public',
    'playlist-modify-private',
];

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

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

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
            sameSite: 'none'
        });

        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email } });

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

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
            sameSite: 'none'
        });

        res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Check Auth Status
router.get('/me', async (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, email: true } });
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json({ user });
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
    console.log('[Spotify Auth] Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});

// Callback route
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        console.log('[Spotify Callback] Code received. Exchanging for token...');
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;

        const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        console.log('[Spotify Callback] Success via Spotify API');
        console.log('[Spotify Callback] Redirecting to Frontend:', clientUrl);

        // Fetch User Profile from Spotify to link/create account
        spotifyApi.setAccessToken(access_token);
        const me = await spotifyApi.getMe();
        const spotifyEmail = me.body.email;
        const spotifyId = me.body.id;

        console.log(`[Spotify Auth] Linked to Spotify User: ${spotifyEmail} (${spotifyId})`);

        if (!spotifyEmail) {
            throw new Error('Spotify did not return an email address');
        }

        // Find or Create User
        let user = await prisma.user.findUnique({ where: { email: spotifyEmail } });

        if (!user) {
            // Create new user with placeholder password
            console.log('[Spotify Auth] Creating new user from Spotify...');
            const placeholderPassword = await bcrypt.hash(`spotify_${spotifyId}_${Date.now()}`, 10);
            user = await prisma.user.create({
                data: {
                    email: spotifyEmail,
                    password_hash: placeholderPassword
                }
            });
        }

        // Generate App Session Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        // Set Auth Token Cookie (Critical for app login)
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
            sameSite: 'none'
        });

        // Set Spotify tokens in cookies
        res.cookie('spotify_access_token', access_token, {
            httpOnly: true,
            secure: true, // Always true for SameSite=None
            maxAge: expires_in * 1000,
            path: '/',
            sameSite: 'none'
        });

        res.cookie('spotify_refresh_token', refresh_token, {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none'
        });

        // Redirect back to frontend
        res.redirect(`${clientUrl}/generate`);
    } catch (error) {
        console.error('Error during Spotify authentication:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        res.redirect(`${clientUrl}/?error=auth_failed`);
    }
});

// --- Google / YouTube Auth ---

router.get('/google', (req, res) => {
    console.log('[Google Auth] Initiating...');
    console.log('[Google Auth] Client ID:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'MISSING');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:4000/auth/google/callback';
    console.log('[Google Auth] Redirect URI:', redirectUri);

    const scopes = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;

    console.log('[Google Auth] Generated URL:', url);

    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const code = req.query.code || null;

    if (!code) {
        const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        return res.redirect(`${clientUrl}/results?error=google_auth_failed`);
    }

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:4000/auth/google/callback',
                grant_type: 'authorization_code',
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('Google Token Error:', data);
            const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
            return res.redirect(`${clientUrl}/results?error=google_token_error`);
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
        let user = await prisma.user.findUnique({ where: { email: googleEmail } });

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

        // Set Auth Token Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
            sameSite: 'none'
        });

        // Set tokens in cookies
        res.cookie('google_access_token', access_token, {
            httpOnly: true,
            secure: true,
            maxAge: expires_in * 1000,
            path: '/',
            sameSite: 'none'
        });

        if (refresh_token) {
            res.cookie('google_refresh_token', refresh_token, {
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'none'
            });
        }

        // Redirect back to frontend
        const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        res.redirect(`${clientUrl}/generate`);

    } catch (error) {
        console.error('Google Auth Error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:3000';
        res.redirect(`${clientUrl}/results?error=server_error`);
    }
});

export default router;
