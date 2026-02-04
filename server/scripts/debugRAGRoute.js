
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix .env loading for scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("🐞 Starting RAG Debugger...");

    // 1. Check Env
    if (!process.env.GOOGLE_API_KEY) {
        console.error("❌ GOOGLE_API_KEY is missing in .env");
        return;
    }
    console.log("✅ API Key found.");

    // 2. Generate Embedding
    console.log("\n🧪 Step 1: Generating Test Embedding...");
    let embeddingVal = null;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent("Happy summer vibes");
        embeddingVal = result.embedding.values;
        console.log(`✅ Embedding generated! Dimensions: ${embeddingVal.length}`);
    } catch (err) {
        console.error("❌ Embedding Failed:", err.message);
        return;
    }

    // 3. Test Playlist Vector Query
    console.log("\n🧪 Step 2: Testing Playlist Vector Search...");
    try {
        // Construct vector string for PG
        const vectorStr = `[${embeddingVal.join(',')}]`;

        const playlists = await prisma.$queryRawUnsafe(
            `SELECT name, 1 - (embedding <=> $1::vector) as similarity 
             FROM "Playlist" 
             WHERE "isPublic" = true 
             LIMIT 1`,
            vectorStr
        );
        console.log(`✅ Playlist Query Success! Found: ${playlists.length} results.`);
    } catch (err) {
        console.error("❌ Playlist Query Failed!");
        console.error("   Error:", err.message);
        if (err.message.includes("type \"vector\" does not exist")) {
            console.error("   👉 CAUSE: 'pgvector' extension is not enabled in the database.");
        }
    }

    // 4. Test TrackKnowledge Vector Query
    console.log("\n🧪 Step 3: Testing Lyrics Vector Search...");
    try {
        const vectorStr = `[${embeddingVal.join(',')}]`;
        const tracks = await prisma.$queryRawUnsafe(
            `SELECT title FROM "TrackKnowledge" ORDER BY "lyricsEmbedding" <=> $1::vector LIMIT 1`,
            vectorStr
        );
        console.log(`✅ Lyrics Query Success! Found: ${tracks.length} results.`);
    } catch (err) {
        console.error("❌ Lyrics Query Failed!");
        console.error("   Error:", err.message);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
