
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking RAG Status in Database...");

    // 1. Check Playlists with Embeddings
    // Note: 'embedding' is Unsupported type in Prisma client for reading raw values usually,
    // but we can check if it relies on raw query or just count.
    // However, Prisma Client might not expose 'embedding' field in findMany for Unsupported types directly 
    // without raw query or latest versions. 
    // Let's use count with raw query to differ "null" from "populated".

    const totalPlaylists = await prisma.playlist.count();

    // Count playlists where embedding is NOT NULL
    const playlistsWithVectors = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "Playlist" WHERE embedding IS NOT NULL
    `;

    // 2. Check TrackKnowledge (Lyrics)
    const totalLyrics = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "TrackKnowledge"
    `;

    console.log("\n📊 RAG Data Stats:");
    console.log(`- Total Playlists: ${totalPlaylists}`);
    console.log(`- Playlists with Vectors: ${playlistsWithVectors[0].count} (These can be retrieved via RAG)`);
    console.log(`- Learned Songs (Lyrics): ${totalLyrics[0].count} (These can be searched by meaning)`);

    if (playlistsWithVectors[0].count === 0 && totalLyrics[0].count === 0) {
        console.log("\n⚠️  Status: RAG is ACTIVE in code, but NO DATA found.");
        console.log("   👉 You need to create public playlists or run a backfill script to populate vectors.");
    } else {
        console.log("\n✅ Status: RAG System is READY and has data to search!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
