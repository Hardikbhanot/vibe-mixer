import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

dotenv.config();

import authRoutes from './routes/auth.js';
import spotifyRoutes from './routes/spotify.js';
import aiRoutes from './routes/ai.js';
import youtubeRoutes from './routes/youtube.js';
import swipeRoutes from './routes/swipe.js';
import userRoutes from './routes/user.js';
import playlistRoutes from './routes/playlists.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust Proxy for Heroku (required for secure cookies)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://vibemixer.hbhanot.tech',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// Debug Middleware for Cookies
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  console.log(' - Origin:', req.headers.origin);
  console.log(' - Cookies:', req.cookies);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/ai', aiRoutes);
app.use('/youtube', youtubeRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/playlists', playlistRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
