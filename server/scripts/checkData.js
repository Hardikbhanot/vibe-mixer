import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking User Data for Matches ---");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            isMatchable: true,
            topArtists: true
        }
    });

    for (const u of users) {
        let artistCount = 0;
        let sampleArtist = "None";
        let isArray = false;

        if (u.topArtists) {
            if (Array.isArray(u.topArtists)) {
                isArray = true;
                artistCount = u.topArtists.length;
                if (artistCount > 0) {
                    sampleArtist = u.topArtists[0].name || JSON.stringify(u.topArtists[0]);
                }
            } else {
                console.log(`[WARNING] User ${u.email} topArtists is NOT an array! Type: ${typeof u.topArtists}`);
            }
        }

        console.log(`User: ${u.email} | Matchable: ${u.isMatchable} | Artists: ${artistCount} | Sample: ${sampleArtist}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
