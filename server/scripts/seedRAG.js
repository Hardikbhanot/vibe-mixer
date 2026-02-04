
import { PrismaClient } from '@prisma/client';
import { fetchLyrics } from '../services/lyrics.js';
import { generateEmbedding } from '../services/embedding.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Env setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const SEED_TRACKS = [
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Lose Yourself", artist: "Eminem" },
    { title: "Someone Like You", artist: "Adele" },
    { title: "Mr. Brightside", artist: "The Killers" },
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Hotel California", artist: "Eagles" },
    { title: "Billie Jean", artist: "Michael Jackson" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana" },
    { title: "Money Trees", artist: "Kendrick Lamar" },
    { title: "Dreams", artist: "Fleetwood Mac" },
    { title: "Blinding Lights", artist: "The Weeknd" },
    { title: "Fix You", artist: "Coldplay" },
    { title: "Fast Car", artist: "Tracy Chapman" }
];

async function main() {
    console.log("🌱 Starting RAG Seeding...");
    console.log(`📋 Target: ${SEED_TRACKS.length} classic tracks.`);

    if (!process.env.GENIUS_ACCESS_TOKEN) {
        console.error("❌ GENIUS_ACCESS_TOKEN missing. Cannot seed.");
        return;
    }

    let successCount = 0;

    for (const track of SEED_TRACKS) {
        try {
            // 1. Check if exists
            const exists = await prisma.trackKnowledge.findUnique({
                where: { title_artist: { title: track.title, artist: track.artist } }
            });

            if (exists) {
                console.log(`⏩ Skipping "${track.title}" (Already learned)`);
                continue;
            }

            // 2. Fetch Lyrics
            console.log(`Downloading lyrics for: "${track.title}"...`);
            const lyrics = await fetchLyrics(track.title, track.artist);

            if (!lyrics) {
                console.warn(`⚠️  No lyrics found for "${track.title}". Skipping.`);
                continue;
            }

            // 3. Vectorize
            console.log(`   - Vectorizing...`);
            const embedding = await generateEmbedding(lyrics);

            // 4. Save
            await prisma.$executeRaw`
                INSERT INTO "TrackKnowledge" (id, title, artist, lyrics, "lyricsEmbedding", "updatedAt")
                VALUES (gen_random_uuid(), ${track.title}, ${track.artist}, ${lyrics}, ${embedding}::vector, NOW())
            `;

            console.log(`✅ Learned: "${track.title}"`);
            successCount++;

        } catch (err) {
            console.error(`❌ Failed "${track.title}":`, err.message);
        }
    }

    console.log(`\n🌱 Seeding Complete! Learned ${successCount} new songs.`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
