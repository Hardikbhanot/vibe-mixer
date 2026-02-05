import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export const fetchLyrics = async (title, artist) => {
    if (!process.env.GOOGLE_API_KEY) {
        console.warn('[Lyrics] GOOGLE_API_KEY is missing. Lyrics fetch skipped.');
        return null;
    }

    try {
        console.log(`[Lyrics] 🧠 Asking Gemini for lyrics: "${title}" by ${artist}...`);

        const prompt = `
            You are a music expert database.
            Please provide the full lyrics for the song "${title}" by "${artist}".
            
            Rules:
            1. Return ONLY the lyrics.
            2. Do not include introductory text like "Here are the lyrics" or "Sure".
            3. Do not include [Chorus], [Verse] tags if possible, just the lines.
            4. If the song is instrumental or you are 100% unsure, return "Not Found".
            5. If there are multiple versions, prefer the original/most popular one.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (text === "Not Found" || text.length < 20 || text.includes("I cannot provide the lyrics")) {
            console.log('[Lyrics] Gemini could not provide lyrics (Instrumental or Copyright blocked).');
            return null;
        }

        console.log(`[Lyrics] Success! Generated/Recalled ${text.length} chars.`);
        return text;

    } catch (error) {
        console.error('[Lyrics] Gemini Error:', error.message);
        return null;
    }
};
