
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
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Adjusted path for script location

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, '../data/bollywood_lyrics.csv');
const DELAY_MS = 100; // Rate limit protection

if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_FILE_PATH}`);
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
        if (error.message && error.message.includes('429')) {
            console.warn('Rate limit hit. Waiting 10s...');
            await sleep(10000);
            return generateEmbeddingSafely(text);
        }
        throw error;
    }
}

// Helper to parse Python-style list string: "['Line 1', 'Line 2']"
function parseLyrics(rawLyrics) {
    if (!rawLyrics) return '';
    try {
        // Remove outer brackets and quotes
        let cleaned = rawLyrics.replace(/^\[/, '').replace(/\]$/, '');

        // Split by comma+space, but handle internal commas if possible (simple split for now)
        // A better regex approach for 'Line 1', 'Line 2'
        const lines = [];
        const regex = /'([^']*)'/g;
        let match;

        while ((match = regex.exec(cleaned)) !== null) {
            // specific filter logic: skip empty strings or 'Lyrics' header
            if (match[1] && match[1] !== 'Lyrics' && match[1].trim() !== '') {
                lines.push(match[1]);
            }
        }

        return lines.join('\n');
    } catch (e) {
        console.error("Error parsing lyrics:", e);
        return rawLyrics;
    }
}


let processedCount = 0;

// Pre-load existing titles to avoid DB hits on resume
const existingTitles = new Set();

async function loadExisting() {
    console.log('Loading existing Bollywood songs...');
    const songs = await prisma.trackKnowledge.findMany({
        where: { artist: 'Bollywood' },
        select: { title: true }
    });
    songs.forEach(s => existingTitles.add(s.title.toLowerCase().trim()));
    console.log(`Loaded ${existingTitles.size} existing songs.`);
}

async function processRow(row) {
    const title = row['Song Title']?.trim();
    // Prefer Hindi Lyrics as requested by user
    const rawHindiLyrics = row['Hindi Lyrics']?.trim();

    if (!title || !rawHindiLyrics) {
        return;
    }

    // Fast memory check
    if (existingTitles.has(title.toLowerCase().trim())) {
        // console.log(`[SKIP] Exists: "${title}"`);
        return;
    }

    const lyrics = parseLyrics(rawHindiLyrics);

    if (lyrics.length < 50) { // Skip very short/empty lyrics
        console.log(`[SKIP] Too short: "${title}"`);
        return;
    }

    console.log(`[PROCESSING] "${title}"...`);
    try {
        // Generate embedding on the HINDI lyrics directly
        const embedding = await generateEmbeddingSafely(lyrics);

        await prisma.$executeRaw`
            INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
            VALUES (gen_random_uuid(), ${title}, 'Bollywood', ${lyrics}, ${embedding}::vector, NOW())
        `;
        console.log(`[SUCCESS] Saved: "${title}"`);
        processedCount++;
        await sleep(DELAY_MS);

    } catch (err) {
        console.error(`[ERROR] Failed to process "${title}":`, err.message);
    }
}

console.log(`Starting Bollywood Import from: ${CSV_FILE_PATH}`);

// Main Execution
; (async () => {
    try {
        await loadExisting(); // Load songs first

        const stream = fs.createReadStream(CSV_FILE_PATH).pipe(csv());

        for await (const row of stream) {
            await processRow(row);
        }

        console.log(`Import complete. Processed ${processedCount} new songs.`);
    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await prisma.$disconnect();
    }
})();
