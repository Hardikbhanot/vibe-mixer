import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.3-70b-versatile"; // Fallback is always the reliable one

// Helper for Model Fallback Logic
const callGroqWithFallback = async (messages, preferredModel = DEFAULT_MODEL, temperature = 0.7, jsonMode = true) => {
    try {
        console.log(`[Groq] Attempting with Model: ${preferredModel}`);
        return await groq.chat.completions.create({
            messages,
            model: preferredModel,
            response_format: jsonMode ? { type: "json_object" } : undefined,
            temperature,
        });
    } catch (error) {
        // Check for Rate Limit (429) or Model Not Found (404) or Bad Request (400 - sometimes happens with beta models)
        if (error.status === 429 || error.code === 'rate_limit_exceeded' || error.status === 404 || error.status === 400) {
            console.warn(`[Groq] Model ${preferredModel} failed (${error.status || error.code}). Falling back to ${FALLBACK_MODEL}...`);

            // If we were already using fallback, just throw to avoid infinite loop
            if (preferredModel === FALLBACK_MODEL) throw error;

            return await groq.chat.completions.create({
                messages,
                model: FALLBACK_MODEL,
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature,
            });
        }
        throw error; // Re-throw other errors
    }
};

// Enhanced function signature
export const generatePlaylistParams = async (userPrompt, vibeType = 'mix', trackCount = 20, features = {}, userContext = "", preferredModel = DEFAULT_MODEL) => {
    console.log('--- Groq Analysis Initiated ---');
    console.log('Vibe Type:', vibeType);
    console.log('Model:', preferredModel);
    if (userContext) console.log('User Context:', userContext);

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

    // Add User Taste Context
    const tasteContext = userContext ? `
    USER TASTE PROFILE (Integrate this style):
    ${userContext}
    Tailor the recommendations to align with these preferences where appropriate.
    ` : "";

    const DYNAMIC_SYSTEM_PROMPT = `
    You are a world-class DJ and music curator AI. Your goal is to interpret the user's mood or activity and generate a curated list of SPECIFIC SONGS for Spotify.

    IMPORTANT INSTRUCTIONS:
    1. **Vibe Strategy**: ${vibeInstruction}
    2. **Exact Vibe Match**: Select songs that PERFECTLY match the user's mood and the target audio features below.${featureContext}
    3. **Personalization**: ${tasteContext}
    4. **Language Diversity**: ACTIVELY INCLUDE songs from various languages and regions if they fit the vibe (e.g., Spanish, Korean, French, Hindi, etc.). Do not limit to English unless requested.
    5. **Tracklist**: Generate **${trackCount} specific songs** (Song Title + Artist) to ensure enough content for the requested duration.
    6. **Reasoning**: For EACH song, provide a short, punchy 1-sentence reason why it fits this specific mood.

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
        const completion = await callGroqWithFallback([
            { role: "system", content: DYNAMIC_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ], preferredModel, 0.7);

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
        const completion = await callGroqWithFallback([
            { role: "system", content: "You are a music curator specializing in Indian regional music. Output JSON only." },
            { role: "user", content: prompt },
        ], DEFAULT_MODEL, 0.7);

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
            model: "llama-3.2-11b-vision-instruct", // Guessing the instructor version exists
            temperature: 0.5,
            max_tokens: 50,
        });

        const moodDescription = completion.choices[0]?.message?.content?.trim();
        console.log('[Groq] Image Analysis Result:', moodDescription);
        return moodDescription || "Eclectic mix";
    } catch (error) {
        console.error("Groq Vision API Error Details:", {
            message: error.message,
            status: error.status,
            code: error.code
        });

        // Fallback if Vision Model is down/decommissioned
        console.warn("[Groq] Vision Model failed. Using fallback vibe.");
        return "Cosmic, Dreamy, Abstract";
    }
};

export const generateVibeAnalysis = async (topArtists, topTracks) => {
    console.log('[Groq] Generating Vibe Analysis...');

    // Format data for prompt
    const artistsList = topArtists ? topArtists.map(a => a.name).join(', ') : 'Unknown';
    const tracksList = topTracks ? topTracks.map(t => `${t.name} by ${t.artist}`).join(', ') : 'Unknown';

    const prompt = `
    Analyze the musical taste of a user based on their top artists and tracks.
    
    Top Artists: ${artistsList}
    Top Tracks: ${tracksList}

    1. Write a creative, cool, and short Bio (max 2 sentences) that describes their "Vibe". Use emojis.
    2. Generate 3-5 short "Vibe Tags" (e.g., "Indie Chill", "Techno Bunker", "Sad Boi Hours").

    Output MUST be valid JSON:
    {
      "bio": "The generated bio string...",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
    `;

    try {
        const completion = await callGroqWithFallback([
            { role: "system", content: "You are a cool music trend analyzer. You speak in a modern, Gen-Z friendly tone. Output JSON only." },
            { role: "user", content: prompt },
        ], DEFAULT_MODEL, 0.8);

        const content = completion.choices[0]?.message?.content;
        console.log('[Groq] Vibe Analysis:', content);
        return JSON.parse(content);
    } catch (error) {
        console.error("Groq Vibe Analysis Error:", error);
        // Fallback
        return { bio: "Music lover with a mysterious vibe. 🎵", tags: ["Eclectic"] };
    }
};


export const extractMusicalKeywords = async (userPrompt) => {
    console.log('[Groq] Extracting musical keywords and vibe parameters...');
    const prompt = `
    Analyze this user request for a music search.
    1. Extract 5-10 musical search keywords (genre, mood, instrument, lyrical themes).
    2. Determine target Audio Features ranges (Valence: 0.0-1.0, Energy: 0.0-1.0).
       - Valence: Low (0.0-0.4) = Sad/Dark, High (0.6-1.0) = Happy/Positive
       - Energy: Low (0.0-0.4) = Calm/Chill, High (0.6-1.0) = Intense/Fast/Party
    
    User Request: "${userPrompt}"
    
    Output JSON ONLY:
    {
      "keywords": "string of keywords separated by spaces",
      "min_valence": 0.0, // float or null if undefined
      "max_valence": 1.0, // float or null if undefined
      "min_energy": 0.0, // float or null if undefined
      "max_energy": 1.0 // float or null if undefined
    }
    `;

    try {
        const completion = await callGroqWithFallback([
            { role: "system", content: "You are a music analysis bot. Output valid JSON only." },
            { role: "user", content: prompt },
        ], "llama-3.3-70b-versatile", 0.5, true); // JSON mode enabled

        const content = completion.choices[0]?.message?.content;
        console.log(`[Groq] Vibe Analysis: ${content}`);
        const result = JSON.parse(content);

        // Ensure keywords exist
        if (!result.keywords) result.keywords = userPrompt;

        return result;
    } catch (error) {
        console.error("Keyword extraction failed:", error);
        return { keywords: userPrompt, min_valence: null, max_valence: null, min_energy: null, max_energy: null };
    }
};
