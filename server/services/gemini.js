import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are a world-class DJ and music curator AI. Your goal is to interpret the user's mood or activity and generate specific search queries and audio features for Spotify.

Output MUST be a valid JSON object with the following structure:
{
  "search_queries": ["query1", "query2", "query3"], // 3-5 specific search queries (e.g., "sad piano instrumental", "rainy jazz")
  "target_valence": 0.5, // 0.0 to 1.0 (0 = sad/negative, 1 = happy/positive)
  "target_energy": 0.5, // 0.0 to 1.0 (0 = calm, 1 = energetic)
  "target_tempo": 120, // Estimated BPM (optional, remove if unsure)
  "playlist_name": "Creative Playlist Name",
  "playlist_description": "A short description of the vibe."
}
`;

export const generatePlaylistParams = async (userPrompt) => {
    console.log('--- Gemini Analysis Initiated ---');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${SYSTEM_PROMPT}\n\nUser Mood: ${userPrompt}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini Response:', text);

        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
