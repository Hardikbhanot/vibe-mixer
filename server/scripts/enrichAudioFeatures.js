
import { PrismaClient } from '@prisma/client';
import Groq from "groq-sdk";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_NAME = "llama-3.3-70b-versatile";
const BATCH_SIZE = 5; // Small batch size for better monitoring
const DELAY_BETWEEN_REQUESTS = 2500; // 2.5s delay = ~24 RPM (Safe for 30 RPM limit)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function cleanJson(text) {
    if (!text) return null;
    try {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = clean.indexOf('{');
        const lastClose = clean.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            clean = clean.substring(firstOpen, lastClose + 1);
        }
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error on text:", text);
        return null;
    }
}

async function estimateAudioFeatures(track) {
    try {
        const prompt = `
        Analyze the lyrics and vibe of the song "${track.title}" by "${track.artist}".
        
        Lyrics Snippet: "${track.lyrics ? track.lyrics.substring(0, 200) : ''}..."

        Estimate the following audio features on a scale of 0.0 to 1.0:
        - Valence: Musical positiveness (0.0 = sad/depressed/angry, 1.0 = happy/cheerful/euphoric).
        - Energy: Intensity and activity (0.0 = calm/quiet, 1.0 = fast/loud/noisy).
        - Danceability: Suitability for dancing (0.0 = not danceable, 1.0 = very danceable).

        Return ONLY a JSON object. No markdown, no explanations.
        Example: { "valence": 0.5, "energy": 0.5, "danceability": 0.5 }
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a music expert AI. Output valid JSON only." },
                { role: "user", content: prompt }
            ],
            model: MODEL_NAME,
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0]?.message?.content;
        return cleanJson(text);
    } catch (error) {
        // Handle Rate Limits elegantly inside the function too
        if (error.status === 429) {
            console.warn(`[429] Rate Limit Hit for ${track.title}. Waiting 5s...`);
            await sleep(5000);
            return null; // Skip this one for now, next batch will pick it up or we retry
        }
        console.error(`Error estimating for ${track.title}:`, error.message);
        return null;
    }
}

async function processBatch() {
    // Find tracks needing estimation
    const tracks = await prisma.trackKnowledge.findMany({
        where: {
            valence: null,
            // Optional: exclude failed ones if needed
        },
        take: BATCH_SIZE
    });

    if (tracks.length === 0) {
        return false; // Done
    }

    console.log(`\n⚡ Processing batch of ${tracks.length} tracks...`);

    // SEQUENTIAL PROCESSING
    // Why? Groq Free Tier = 30 Requests Per Minute.
    // Parallel usage hits this instantly.

    let successCount = 0;

    for (const track of tracks) {
        const features = await estimateAudioFeatures(track);

        if (features) {
            console.log(`   - [${track.title}] V:${features.valence}, E:${features.energy}`);
            await prisma.trackKnowledge.update({
                where: { id: track.id },
                data: {
                    spotifyId: 'AI_ESTIMATED_GROQ',
                    valence: features.valence,
                    energy: features.energy,
                    danceability: features.danceability,
                    acousticness: 0.5,
                    tempo: 120,
                    instrumentalness: 0
                }
            });
            successCount++;
        } else {
            console.log(`   x Failed: ${track.title}`);
            // Mark as error so we don't infinite loop on broken ones immediately
            // But for Rate Limits we might want to leave it null? 
            // Let's mark it error for now to keep moving.
            await prisma.trackKnowledge.update({
                where: { id: track.id },
                data: { spotifyId: 'AI_ERROR_GROQ' }
            });
        }

        // CRITICAL DELAY
        await sleep(DELAY_BETWEEN_REQUESTS);
    }

    console.log(`   ✅ Batch completed (${successCount}/${tracks.length} success).`);
    return true; // Continue
}

// Main
; (async () => {
    console.log("🚀 Starting Audio Feature Enrichment with Groq (Sequential / Rate-Limited)...");
    let hasMore = true;
    while (hasMore) {
        try {
            hasMore = await processBatch();
            // No extra batch delay needed since we delay per item, but a small one helps consistency
            if (hasMore) await sleep(1000);
        } catch (e) {
            console.error("Batch Error:", e);
            await sleep(5000);
        }
    }

    console.log('🎉 Enrichment complete!');
    await prisma.$disconnect();
})();
