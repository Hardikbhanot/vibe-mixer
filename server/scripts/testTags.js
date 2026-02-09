import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        console.log("Checking API Key:", process.env.GOOGLE_API_KEY ? "Present" : "Missing");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Note: listModels is on the genAI instance or via model manager in newer SDKs?
        // In @google/generative-ai, it's not directly exposed on genAI instance usually.
        // Actually, for the Node SDK, we might need to rely on what works. 
        // But let's try a simple generation test with a known safe model if listModels isn't easy.

        // Wait, listModels might not be in the high-level SDK `GoogleGenerativeAI`.
        // It is often in `GoogleAIFileManager` or similar, OR we just test common names.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "text-embedding-004"
        ];

        for (const modelName of modelsToTest) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                if (modelName.includes("embedding")) {
                    await model.embedContent("Test");
                } else {
                    await model.generateContent("Test");
                }
                console.log(`✅ ${modelName} is WORKING.`);
            } catch (error) {
                console.log(`❌ ${modelName} Failed: ${error.message.split('[')[0]}`); // Short error
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
