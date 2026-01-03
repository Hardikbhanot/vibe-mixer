
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { isAdmin: true }
    });

    console.log('Found Admins:', users.length);

    for (const user of users) {
        console.log(`Admin [${user.username}]: isMatchable=${user.isMatchable}, isPublic=${user.isPublic}`);

        if (!user.isMatchable) {
            console.log('Updating Admin to be matchable...');
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isMatchable: true,
                    isPublic: true // Ensure they are public too just in case
                }
            });
            console.log('Admin updated!');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
