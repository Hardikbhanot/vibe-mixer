import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

Do not include markdown formatting (like \`\`\`json). Just return the raw JSON string.
`;

export const generatePlaylistParams = async (userPrompt) => {
    console.log('--- OpenAI Analysis Initiated ---');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            model: "gpt-3.5-turbo", // or gpt-4 if available/preferred
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        // Attempt to parse JSON
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse OpenAI response:", content);
            // Fallback or retry logic could go here
            throw new Error("Invalid JSON response from AI");
        }
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw error;
    }
};
