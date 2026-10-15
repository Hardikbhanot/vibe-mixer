import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function main() {
    try {
        const total = await prisma.trackKnowledge.count();
        const emb = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM "TrackKnowledge" WHERE "lyricsEmbedding" IS NOT NULL');
        const val = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM "TrackKnowledge" WHERE "valence" IS NOT NULL');
        const nrg = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM "TrackKnowledge" WHERE "energy" IS NOT NULL');
        const bpm = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM "TrackKnowledge" WHERE "tempo" IS NOT NULL');
        
        console.log('=== TrackKnowledge DB Stats ===');
        console.log('Total tracks:', total);
        console.log('With lyrics embeddings:', emb[0].count);
        console.log('With valence:', val[0].count);
        console.log('With energy:', nrg[0].count);
        console.log('With tempo:', bpm[0].count);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
