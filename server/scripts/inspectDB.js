import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    console.log("🔍 Inspecting Database for RAG Vectors...\n");

    // 1. Check Playlists
    const playlists = await prisma.playlist.findMany({
        take: 5,
        where: { isPublic: true },
        select: { name: true, description: true }
    });

    console.log(`--- 📂 Stored Playlists (${playlists.length} sample) ---`);
    if (playlists.length === 0) console.log("❌ No Public Playlists found (RAG will fail for Playlists).");
    playlists.forEach(p => console.log(`• "${p.name}": ${p.description}`));

    console.log("\n");

    // 2. Check Track Knowledge (Lyrics)
    const tracks = await prisma.trackKnowledge.findMany({
        take: 10,
        select: { title: true, artist: true, lyrics: true }
    });

    console.log(`--- 🎵 Stored Lyrics Knowledge (${tracks.length} sample) ---`);
    if (tracks.length === 0) console.log("❌ No Lyrics stored (RAG will fail for Song Matching).");

    tracks.forEach(t => {
        const snippet = t.lyrics.substring(0, 50).replace(/\n/g, ' ');
        console.log(`• "${t.title}" by ${t.artist} -> "${snippet}..."`);
    });

    console.log("\n✅ Inspection Complete.");
}

inspect()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
