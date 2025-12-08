import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});



export const generatePlaylistParams = async (userPrompt, vibeType = 'mix', trackCount = 20, features = {}) => {
    console.log('--- Groq Analysis Initiated ---');
    console.log('Vibe Type:', vibeType);
    console.log('Target Tracks:', trackCount);

    let vibeInstruction = "";
    if (vibeType === 'offbeat') {
        vibeInstruction = "Prioritize songs from LESSER-KNOWN, INDEPENDENT, or UNDERGROUND artists. Avoid mainstream creators and top-charting artists. Look for hidden gems.";
    } else if (vibeType === 'popular') {
        vibeInstruction = "Prioritize GLOBAL TOP HITS, CHART-TOPPERS, and POPULAR CLASSICS. Avoid obscure tracks.";
    } else {
        vibeInstruction = "Provide a BALANCED MIX of popular hits and hidden gems.";
    }

    // Construct feature context if available
    const featureContext = features.energy ? `
    Target Audio Features:
    - Energy: ${features.energy}% (0=Calm, 100=Intense)
    - Tempo: ${features.tempo}% (0=Slow, 100=Fast)
    - Valence: ${features.valence}% (0=Sad/Dark, 100=Happy/Positive)
    ` : "";

    const DYNAMIC_SYSTEM_PROMPT = `
You are a world-class DJ and music curator AI. Your goal is to interpret the user's mood or activity and generate a curated list of SPECIFIC SONGS for Spotify.

IMPORTANT INSTRUCTIONS:
1. **Vibe Strategy**: ${vibeInstruction}
2. **Exact Vibe Match**: Select songs that PERFECTLY match the user's mood and the target audio features below.${featureContext}
3. **Language Diversity**: ACTIVELY INCLUDE songs from various languages and regions if they fit the vibe (e.g., Spanish, Korean, French, Hindi, etc.). Do not limit to English unless requested.
4. **Tracklist**: Generate **${trackCount} specific songs** (Song Title + Artist) to ensure enough content for the requested duration.

Output MUST be a valid JSON object with the following structure:
{
  "suggested_tracks": [
    { "song": "Song Name 1", "artist": "Artist Name 1" },
    { "song": "Song Name 2", "artist": "Artist Name 2" },
    ...
  ], 
  "playlist_name": "Creative Playlist Name",
  "playlist_description": "A short description of the vibe.",
  "cover_art_description": "A vivid, artistic, and abstract description of a cover image that represents this vibe. Do not include text."
}
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: DYNAMIC_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        console.log('Groq Response:', content);

        return JSON.parse(content);
    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
};

export const getRegionalVibeQuery = async (region) => {
    console.log(`[Groq] Generating vibe query for region: ${region}`);

    const prompt = `
    You are a local music expert for ${region}, India.
    Create a specific YouTube search query to find popular, iconic, and culturally significant INDIVIDUAL songs from ${region}.
    The goal is to get a list of separate official music videos, NOT long "Jukebox", "Mashup", "Nonstop", or "Compilation" videos.
    
    The query should be specific enough to bring up high-quality official videos.
    Examples: "Best Punjabi Songs Official Video", "Kerala Folk Songs Full Video", "Rajasthan Traditional Songs Original".
    
    Output MUST be a valid JSON object:
    {
      "searchQuery": "The optimized search query string"
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a music curator specializing in Indian regional music. Output JSON only." },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        console.log('[Groq] Vibe Query:', content);
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq API Error (Regional):", error);
        // Fallback
        return { searchQuery: `Best ${region} songs india` };
    }
};
