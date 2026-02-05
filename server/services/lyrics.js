import axios from 'axios';
import lyricsFinder from 'lyrics-finder';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const fetchLyrics = async (title, artist) => {
    let lyrics = "";

    // --- TIER 1: Public API (Lyrist) ---
    try {
        console.log(`[Lyrics] 🌐 Tier 1: Checking Public API for "${title}"...`);
        const { data } = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`);
        if (data && data.lyrics && data.lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Tier 1 Success! (API)`);
            return data.lyrics;
        }
    } catch (e) { /* Ignore API errors */ }

    // --- TIER 2: Scraper (lyrics-finder) ---
    // This scrapes Google/MusixMatch/LyricFind (NodeJS equivalent of the user's suggestion)
    try {
        console.log(`[Lyrics] 🕵️ Tier 2: Scraping (Lyrics-Finder)...`);
        lyrics = await lyricsFinder(artist, title) || "";
        if (lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Tier 2 Success! (Scraper)`);
            return lyrics;
        }
    } catch (e) {
        console.warn(`[Lyrics] Scraper failed: ${e.message}`);
    }

    // --- TIER 3: AI Fallback (Gemini 2.5) ---
    if (!process.env.GOOGLE_API_KEY) return null;

    try {
        console.log(`[Lyrics] 🧠 Tier 3: Asking Gemini 2.5 (AI Memory)...`);
        const prompt = `Return the lyrics for "${title}" by "${artist}". Return ONLY text, no markdown, no intro. If unrelated or instrumental, return "NOT_FOUND".`;

        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();

        if (text === "NOT_FOUND" || text.includes("I cannot provide") || text.length < 50) {
            console.log(`[Lyrics] ❌ All Tiers Failed for "${title}".`);
            return null;
        }

        console.log(`[Lyrics] ✅ Tier 3 Success! (AI)`);
        return text;

    } catch (aiError) {
        console.error('[Lyrics] Gemini Error:', aiError.message);
        return null;
    }
};
