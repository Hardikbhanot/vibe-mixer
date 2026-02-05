import axios from 'axios';

export const generateImage = async (prompt) => {
    try {
        console.log('[Imagen] Generating cover art for:', prompt);

        const cleanPrompt = encodeURIComponent(prompt.trim().slice(0, 500));
        // Use Flux model for better quality, ensure nologo
        const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&model=flux`;

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
        console.log("[Imagen] Falling back to Unsplash...");

        // Fallback: Unsplash
        const keywords = encodeURIComponent(prompt.split(' ').slice(0, 2).join(','));
        return `https://source.unsplash.com/1600x1600/?${keywords},art`;
    }
};
