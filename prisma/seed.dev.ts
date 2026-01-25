import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Create demo users: one client, two advisors
    const users = await prisma.user.createMany({
        data: [
            {
                email: "client1@demo.local",
                name: "Client One",
                password: passwordHash,
                role: "CLIENT",
                isActive: true,
            },
            {
                email: "advisor1@demo.local",
                name: "Advisor One",
                password: passwordHash,
                role: "ADVISOR",
                isActive: true,
            },
            {
                email: "advisor2@demo.local",
                name: "Advisor Two",
                password: passwordHash,
                role: "ADVISOR",
                isActive: true,
            },
        ],
        skipDuplicates: true,
    });

    console.log(`Seeded users: ${users.count}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
