import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export const generateImage = async (prompt) => {
    try {
        console.log('Generating image with prompt:', prompt);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: prompt,
        });

        const candidate = response.candidates[0];
        if (candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};
