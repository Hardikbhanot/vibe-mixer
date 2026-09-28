import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanTitles() {
    console.log('Starting Database Title Cleanup...');
    const tracks = await prisma.trackKnowledge.findMany({
        select: { id: true, title: true }
    });

    let updatedCount = 0;
    const batchSize = 1000;

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const cleanTitle = track.title
            .split('(')[0]
            .split('[')[0]
            .split('-')[0]
            .split('feat.')[0]
            .replace(/official video/gi, '')
            .replace(/lyrics/gi, '')
            .trim();

        if (cleanTitle !== track.title) {
            try {
                await prisma.trackKnowledge.update({
                    where: { id: track.id },
                    data: { title: cleanTitle }
                });
                updatedCount++;
            } catch (err) {
                if (err.code === 'P2002') {
                    // Collision with an existing clean track -> Delete the dirty duplicate
                    await prisma.trackKnowledge.delete({ where: { id: track.id } });
                    updatedCount++; // Count as cleaned (deleted)
                } else {
                    console.error('Error updating track:', err);
                }
            }
        }

        if (i > 0 && i % batchSize === 0) {
            console.log(`Processed ${i} / ${tracks.length} tracks...`);
        }
    }

    console.log(`\nCleanup Complete! Cleaned ${updatedCount} legacy dirty titles.`);
}

cleanTitles()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
