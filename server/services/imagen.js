import axios from 'axios';

export const generateImage = async (prompt) => {
    try {
        console.log('[Imagen] Generating cover art for:', prompt);

        // Enforce abstract, aesthetic album cover art; strictly prohibit human faces and realistic portraits
        const enrichedPrompt = `modern aesthetic vinyl album cover art, graphic design typography, abstract 3d textures, vibrant neon geometric visual art, ${prompt.trim().replace(/face|portrait|girl|woman|man|person|human/gi, '')}, strictly no human faces, no portraits, no people, no selfies`;
        const cleanPrompt = encodeURIComponent(enrichedPrompt.slice(0, 480));
        // Use Flux model for better quality, ensure nologo
        const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&model=flux&enhance=true`;

        console.log('[Imagen] Fetching from Pollinations (Flux)...');

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                // Mimic browser to avoid bot blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000 // 15s timeout
        });

        // Convert binary data to Base64
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        const dataUri = `data:${contentType};base64,${base64Image}`;

        console.log('[Imagen] Success! Generated image.');
        return dataUri;

    } catch (error) {
        console.error("[Imagen] Generation Failed:", error.message);
        console.log("[Imagen] Falling back to curated abstract vinyl art...");

        // Fallback: Aesthetic abstract artwork
        return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&h=1024&fit=crop`;
    }
};
