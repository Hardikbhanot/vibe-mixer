import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTISTS_POOL = [
    { id: '1', name: 'The Weeknd' },
    { id: '2', name: 'Arctic Monkeys' },
    { id: '3', name: 'Tame Impala' },
    { id: '4', name: 'Drake' },
    { id: '5', name: 'Taylor Swift' },
    { id: '6', name: 'Kanye West' },
    { id: '7', name: 'Radiohead' },
    { id: '8', name: 'Daft Punk' },
    { id: '9', name: 'Lana Del Rey' },
    { id: '10', name: 'Frank Ocean' }
];

async function main() {
    console.log("--- Seeding Match Data ---");

    const users = await prisma.user.findMany({ select: { id: true, email: true } });

    for (const user of users) {
        // Randomly pick 5 artists
        const shuffled = [...ARTISTS_POOL].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        console.log(`Updating ${user.email} with ${selected.length} artists...`);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isMatchable: true,
                topArtists: selected,
                topTracks: [], // Empty for now
                username: user.username || user.email.split('@')[0] // Ensure username exists
            }
        });
    }

    console.log("--- Seeding Complete! ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
