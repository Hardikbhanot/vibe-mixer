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

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/ai', aiRoutes);
app.use('/youtube', youtubeRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
