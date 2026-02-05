import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini 2.5 Flash (Confirmed Available)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const fetchLyrics = async (title, artist) => {
    // 1. Try Public Lyrics API (Real Data)
    try {
        console.log(`[Lyrics] 🌐 Checking public API for: "${title}"...`);
        // Lyrist is a clean wrapper around various lyric sources
        const { data } = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`);

        if (data && data.lyrics && data.lyrics.length > 50) {
            console.log(`[Lyrics] ✅ Found via Public API! (${data.lyrics.length} chars)`);
            return data.lyrics;
        }
    } catch (apiError) {
        console.warn(`[Lyrics] Public API failed (${apiError.message}). Switch to AI Fallback.`);
    }

    // 2. Fallback: Ask Gemini 2.5 (AI Memory)
    if (!process.env.GOOGLE_API_KEY) return null;

    try {
        console.log(`[Lyrics] 🧠 Fallback to Gemini 2.5 Flash...`);
        const prompt = `Return the lyrics for "${title}" by "${artist}". Return ONLY text, no markdown, no intro. If unrelated or instrumental, return "NOT_FOUND".`;

        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();

        if (text === "NOT_FOUND" || text.includes("I cannot provide") || text.length < 50) {
            console.log(`[Lyrics] Gemini returned: ${text.substring(0, 20)}...`);
            return null;
        }

        console.log(`[Lyrics] ✅ Gemini Recalled! (${text.length} chars)`);
        return text;

    } catch (aiError) {
        console.error('[Lyrics] Gemini Error:', aiError.message);
        return null;
    }
};
