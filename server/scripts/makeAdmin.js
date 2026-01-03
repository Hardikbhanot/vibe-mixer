import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const targetEmail = 'hardikbhanot123@gmail.com';

async function main() {
    console.log(`Searching for user: ${targetEmail}...`);
    const user = await prisma.user.findUnique({
        where: { email: targetEmail }
    });

    if (!user) {
        console.error(`User ${targetEmail} not found! Ensure you have logged in at least once.`);
        return;
    }

    console.log(`Found user ${user.id} (${user.username}). Promoting to Admin...`);

    await prisma.user.update({
        where: { email: targetEmail },
        data: { isAdmin: true }
    });

    console.log(`SUCCESS: ${targetEmail} is now an Admin! 👑`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
