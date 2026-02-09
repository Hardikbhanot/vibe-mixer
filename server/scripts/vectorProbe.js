import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Fix path to point to server/.env relative to CWD
dotenv.config({ path: 'server/.env' });

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function probe(query) {
    console.log(`\n🔎 Probing Vector Space for: "${query}"`);
    console.log("------------------------------------------------");

    // 1. Generate Vector
    const result = await model.embedContent(query);
    const embedding = result.embedding.values;

    // 2. Find Closest Playlists (Concept Match)
    const playlists = await prisma.$queryRawUnsafe(
        `SELECT name, description, 1 - (embedding <=> $1::vector) as similarity 
         FROM "Playlist" 
         WHERE "isPublic" = true 
         ORDER BY similarity DESC 
         LIMIT 3`,
        `[${embedding.join(',')}]`
    );

    console.log(`\n📂 Playlist Concepts (Macro Level):`);
    playlists.forEach(p => {
        console.log(`   [${(p.similarity * 100).toFixed(1)}%] "${p.name}"`);
        console.log(`         (${p.description.substring(0, 60)}...)`);
    });

    // 3. Find Closest Lyrics (Micro Level)
    const lyrics = await prisma.$queryRawUnsafe(
        `SELECT title, artist, lyrics, 1 - ("lyricsEmbedding" <=> $1::vector) as similarity 
         FROM "TrackKnowledge" 
         ORDER BY similarity DESC 
         LIMIT 3`,
        `[${embedding.join(',')}]`
    );

    console.log(`\n🎵 Lyrical Meanings (Micro Level):`);
    lyrics.forEach(t => {
        const snippet = t.lyrics.substring(0, 50).replace(/\n/g, ' ');
        console.log(`   [${(t.similarity * 100).toFixed(1)}%] "${t.title}" by ${t.artist}`);
        console.log(`         Match: "${snippet}..."`);
    });
}

async function main() {
    await probe("90s indian nostalgia");
    await probe("sad heartbreak lonely");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
