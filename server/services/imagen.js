import axios from 'axios';

export const generateImage = async (prompt) => {
    try {
        console.log('Generating image URL for prompt:', prompt);

        const cleanPrompt = encodeURIComponent(prompt.trim().slice(0, 500));
        const apiKey = process.env.POLLINATIONS_AI_API_KEY;
        const seed = Math.floor(Math.random() * 1000000);

        // URL for the image (GET request to generate)
        const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

        console.log('[Imagen] Fetching from Pollinations (Server-Side)...');

        // Fetch the image data on the server with the API Key in header
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: apiKey ? {
                'Authorization': `Bearer ${apiKey}`
            } : {}
        });

        // Convert binary data to Base64 Data URI
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        const dataUri = `data:${contentType};base64,${base64Image}`;

        console.log('[Imagen] Successfully generated and buffered image.');
        return dataUri;

    } catch (error) {
        console.error("Error generating image:", error.message);
        // Fallback
        return "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1600&auto=format&fit=crop";
    }
};
