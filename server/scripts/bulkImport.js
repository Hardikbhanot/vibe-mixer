
import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Configuration
const CSV_FILE_PATH = process.argv[2] || path.resolve(__dirname, '../data/lyrics.csv');
const BATCH_SIZE = 1; // Process 1 at a time to be safe with rate limits
const DELAY_MS = 4000; // 4s delay -> ~15 req/min (well under 60RPM free tier for text-embedding)

if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_FILE_PATH}`);
    console.log('Usage: node scripts/bulkImport.js <path_to_csv>');
    process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbeddingSafely(text) {
    try {
        const result = await embeddingModel.embedContent(text, { outputDimensionality: 768 });
        return result.embedding.values;
    } catch (error) {
        if (error.message.includes('429')) {
            console.warn('Rate limit hit. Waiting 60s...');
            await sleep(60000);
            return generateEmbeddingSafely(text); // Retry once
        }
        throw error;
    }
}

async function processRow(row) {
    const title = row.title?.trim();
    const artist = row.artist?.trim();
    let lyrics = row.lyrics?.trim();

    if (!title || !artist || !lyrics) {
        console.warn('Skipping row: Missing data', row);
        return;
    }

    // Clean lyrics (basic)
    lyrics = lyrics.replace(/^Lyrics/i, '').trim();

    // Check DB
    const existing = await prisma.trackKnowledge.findFirst({
        where: {
            title: { equals: title, mode: 'insensitive' },
            artist: { equals: artist, mode: 'insensitive' }
        }
    });

    if (existing) {
        console.log(`[SKIP] Exists: "${title}" by ${artist}`);
        return;
    }

    // Generate Embedding
    console.log(`[PROCESSING] "${title}" by ${artist}...`);
    try {
        const embedding = await generateEmbeddingSafely(lyrics);

        // Insert
        await prisma.$executeRaw`
            INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
            VALUES (gen_random_uuid(), ${title}, ${artist}, ${lyrics}, ${embedding}::vector, NOW())
        `;
        console.log(`[SUCCESS] Saved: "${title}"`);

        // Rate Limit Delay
        await sleep(DELAY_MS);

    } catch (err) {
        console.error(`[ERROR] Failed to process "${title}":`, err.message);
    }
}

const queue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {
        const row = queue.shift();
        await processRow(row);
    }

    isProcessing = false;
}

console.log(`Starting Bulk Import from: ${CSV_FILE_PATH}`);

fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
        queue.push(row);
        processQueue();
    })
    .on('end', async () => {
        // Wait for queue to drain
        const interval = setInterval(() => {
            if (queue.length === 0 && !isProcessing) {
                console.log('CSV processing complete.');
                clearInterval(interval);
                prisma.$disconnect();
            }
        }, 1000);
    });
