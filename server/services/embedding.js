import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export const generateEmbedding = async (text) => {
    try {
        console.log(`[Embedding] Generating embedding for: "${text.substring(0, 50)}..."`);
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
    }
};
