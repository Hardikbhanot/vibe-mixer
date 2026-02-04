
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Inspecting Vector Data...");

    // 1. Fetch one saved playlist with vector
    // We use $queryRaw because Prisma Client doesn't natively expose 'Unsupported' types like vector
    const playlists = await prisma.$queryRaw`
        SELECT name, description, embedding::text 
        FROM "Playlist" 
        WHERE embedding IS NOT NULL 
        LIMIT 1
    `;

    console.log("\n--- 🎵 Playlists (Vibe Memory) ---");
    if (playlists.length > 0) {
        const p = playlists[0];
        const vector = JSON.parse(p.embedding); // Postgres returns string "[0.1, ...]"
        console.log(`Name: ${p.name}`);
        console.log(`Vector (First 5 dims): [${vector.slice(0, 5).join(', ')}, ...trunk...]`);
        console.log(`Total Dimensions: ${vector.length}`);
    } else {
        console.log("(No vectorized playlists found yet. Save a playlist to generate one!)");
    }

    // 2. Fetch one learned track
    const tracks = await prisma.$queryRaw`
        SELECT title, artist, "lyricsEmbedding"::text 
        FROM "TrackKnowledge" 
        LIMIT 1
    `;

    console.log("\n--- 📖 TrackKnowledge (Lyrics Memory) ---");
    if (tracks.length > 0) {
        const t = tracks[0];
        const vector = JSON.parse(t.lyricsEmbedding);
        console.log(`Track: "${t.title}" by ${t.artist}`);
        console.log(`Vector (First 5 dims): [${vector.slice(0, 5).join(', ')}, ...trunk...]`);
        console.log(`Total Dimensions: ${vector.length}`);
    } else {
        console.log("(No lyrics learned yet. Save a playlist with new songs!)");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
