
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
const DELAY_MS = 100; // 0.1s delay -> ~600 req/min (Paid Tier: fast & cheap)

if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_FILE_PATH}`);
    console.log('Usage: node scripts/bulkImport.js <path_to_csv>');
    process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbeddingSafely(text) {
    try {
        const result = await embeddingModel.embedContent({
            content: { parts: [{ text: text }] },
            outputDimensionality: 768
        });
        return result.embedding.values;
    } catch (error) {
        if (error.message.includes('429')) {
            console.warn('Rate limit hit (Quota Exceeded?). Waiting 10s...');
            await sleep(10000);
            return generateEmbeddingSafely(text); // Retry once
        }
        throw error;
    }
}

// Storage Limit Safeguard
const MAX_SONGS = 500000;
const MIN_VIEWS = 100000; // Prioritize high-impact tracks (100k+ views)

let processedCount = 0;

async function processRow(row) {
    const title = row.title?.trim();
    const artist = row.artist?.trim();
    let lyrics = row.lyrics?.trim();
    const views = parseInt(row.views || '0');

    if (!title || !artist || !lyrics) {
        return;
    }

    if (views < MIN_VIEWS) {
        return;
    }

    if (processedCount >= MAX_SONGS) {
        console.log('[INFO] Reached storage limit. Stopping.');
        process.exit(0);
    }

    lyrics = lyrics.replace(/^Lyrics/i, '').trim();

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

    console.log(`[PROCESSING] "${title}" by ${artist}...`);
    try {
        const embedding = await generateEmbeddingSafely(lyrics);

        await prisma.$executeRaw`
            INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
            VALUES (gen_random_uuid(), ${title}, ${artist}, ${lyrics}, ${embedding}::vector, NOW())
        `;
        console.log(`[SUCCESS] Saved: "${title}" (Views: ${views})`);
        processedCount++;

        await sleep(DELAY_MS);

    } catch (err) {
        console.error(`[ERROR] Failed to process "${title}":`, err.message);
    }
}

console.log(`Starting Bulk Import from: ${CSV_FILE_PATH}`);

// Main Execution with Async Iterator for Memory Safety
; (async () => {
    try {
        const stream = fs.createReadStream(CSV_FILE_PATH).pipe(csv());

        for await (const row of stream) {
            await processRow(row);
        }

        console.log('CSV processing complete.');
    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await prisma.$disconnect();
    }
})();
