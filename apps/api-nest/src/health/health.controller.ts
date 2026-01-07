import { Controller, Get } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { resolveDbDriver } from "@proj/infra";
import { getDrizzleDb } from "@proj/infra";
import { sql } from "drizzle-orm";

@Controller('health')
export class HealthController {
    @Get('db')
    async healthDb() {
        const driver = resolveDbDriver();

        if (driver === 'memory' || !process.env.DATABASE_URL) {
            return { status: 'ok', driver, db: 'skipped (memory/no URL)' };
        }

        try {
            if (driver === "mariadb") {
                const db = getDrizzleDb();
                await db.execute(sql`SELECT 1`);
            } else {
                const prisma = new PrismaClient();
                await prisma.$queryRaw`SELECT 1`;
                await prisma.$disconnect();
            }
            return { status: 'ok', driver, db: 'connected' };
        } catch (e: any) {
            return { status: 'error', driver, db: 'unreachable', error: e?.message ?? String(e) };
        }
    }
}
