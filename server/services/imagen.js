import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const generateImage = async (prompt) => {
    try {
        console.log('[Imagen] Generating cover art for:', prompt);

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("Missing GOOGLE_API_KEY");
        }

        // Google Imagen 3 API (via AI Studio / Generative Language API)
        // Note: This endpoint is for the specialized image generation model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

        const payload = {
            instances: [
                {
                    prompt: `${prompt}, high quality, 4k, album cover art, aesthetic, vibrant`,
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                personGeneration: "allow_adult", // Required setting for some prompts
            }
        };

        console.log('[Imagen] Calling Google API...');
        const response = await axios.post(url, payload);

        if (response.data && response.data.predictions && response.data.predictions.length > 0) {
            const base64Image = response.data.predictions[0].bytesBase64Encoded;
            const mimeType = response.data.predictions[0].mimeType || 'image/png';

            console.log('[Imagen] Success! Google generated an image.');
            return `data:${mimeType};base64,${base64Image}`;
        } else {
            throw new Error('No predictions in Google API response');
        }

    } catch (error) {
        console.error("[Imagen] Google Generation Failed:", error.response?.data || error.message);
        console.log("[Imagen] Falling back to Unsplash...");

        // Robust Fallback: Unsplash Source with keywords
        const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(','));
        return `https://source.unsplash.com/1600x1600/?${keywords},abstract`;
    }
};
