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
5. **Reasoning**: For EACH song, provide a short, punchy 1-sentence reason why it fits this specific mood.

Output MUST be a valid JSON object with the following structure:
{
  "suggested_tracks": [
    { 
      "song": "Song Name 1", 
      "artist": "Artist Name 1",
      "reason": "Short reason why this song fits the vibe."
    },
    { 
      "song": "Song Name 2", 
      "artist": "Artist Name 2",
      "reason": "Short reason why this song fits the vibe."
    }
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
        console.log('Groq Response Length:', content.length);

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

export const analyzeImage = async (base64Image, mimeType = 'image/jpeg') => {
    console.log(`[Groq] Analyzing image (${mimeType}) with Vision model...`);

    const prompt = `
    Analyze this image and describe the mood, atmosphere, and visual aesthetic in 3-4 concise keywords suitable for a music playlist.
    Examples: "Melancholic rainy jazz", "Neon cyberpunk synthwave", "Sunny acoustic roadtrip".
    Return ONLY the keywords, separated by spaces or commas. Do not write sentences or descriptions.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: "llama-3.2-90b-vision-preview", // Updated to 90b vision preview for better accuracy
            temperature: 0.5,
            max_tokens: 50,
        });

        const moodDescription = completion.choices[0]?.message?.content?.trim();
        console.log('[Groq] Image Analysis Result:', moodDescription);
        return moodDescription || "Eclectic mix";
    } catch (error) {
        console.error("Groq Vision API Error Details:", {
            message: error.message,
            type: error.type,
            code: error.code,
            param: error.param,
            response: error.error
        });
        console.error("Image Payload Size:", base64Image.length);
        throw error;
    }
};
