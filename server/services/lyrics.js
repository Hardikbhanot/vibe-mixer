import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// 1. Primary: Groq (Llama 3)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. Secondary: Google Gemini (Flash)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const fetchLyrics = async (title, artist) => {
    // Strategy: Try Groq -> Fallback to Gemini -> Give Up

    let lyrics = await fetchWithGroq(title, artist);

    if (!lyrics) {
        console.log(`[Lyrics] Groq missed it. Trying Gemini fallback...`);
        lyrics = await fetchWithGemini(title, artist);
    }

    if (lyrics) {
        console.log(`[Lyrics] ✅ Success! Saved ${lyrics.length} chars.`);
        return lyrics;
    } else {
        console.log(`[Lyrics] ❌ Both AIs failed for "${title}". Skipping.`);
        return null;
    }
};

async function fetchWithGroq(title, artist) {
    if (!process.env.GROQ_API_KEY) return null;
    try {
        console.log(`[Lyrics] ⚡ Asking Groq (Llama 3)... "${title}"`);
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a music database interaction layer. Return ONLY the song lyrics directly. No markdown code blocks, no intro, no outro. If it is an instrumental or you do not know the lyrics with high confidence, return 'NOT_FOUND'."
                },
                {
                    role: "user",
                    content: `Lyrics for "${title}" by "${artist}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3, // Slightly higher for better recall
            max_tokens: 3000
        });

        const text = completion.choices[0]?.message?.content?.trim();
        if (!text || text === "NOT_FOUND" || text.includes("I cannot provide") || text.length < 50) return null;
        return text;
    } catch (e) {
        console.error('[Lyrics] Groq Error:', e.message);
        return null;
    }
}

async function fetchWithGemini(title, artist) {
    if (!process.env.GOOGLE_API_KEY) return null;
    try {
        console.log(`[Lyrics] 🧠 Asking Gemini (Flash)... "${title}"`);
        const prompt = `Return the lyrics for "${title}" by "${artist}". Return ONLY text. If unknown or instrumental, return "NOT_FOUND".`;
        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text().trim();

        if (text === "NOT_FOUND" || text.includes("I cannot provide") || text.length < 50) return null;
        return text;
    } catch (e) {
        console.error('[Lyrics] Gemini Error:', e.message);
        return null;
    }
}
