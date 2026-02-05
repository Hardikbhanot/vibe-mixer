import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("❌ No GOOGLE_API_KEY found in environment.");
    process.exit(1);
}

// Hack: The Node SDK doesn't expose listModels directly easily on the main client in some versions,
// but we can try to use the REST API via fetch if the SDK fails, or just try to invoke a model we hope works.
// However, the error message itself suggested "Call ListModels".

async function checkModels() {
    console.log("🔍 Checking available models for provided API Key...");

    // Direct REST call to list models v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("\n✅ Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` - ${m.name} (Supported)`);
                } else {
                    console.log(` - ${m.name} (Not for generateContent)`);
                }
            });
        }

    } catch (error) {
        console.error("❌ Failed to list models:", error.message);
    }
}

checkModels();
