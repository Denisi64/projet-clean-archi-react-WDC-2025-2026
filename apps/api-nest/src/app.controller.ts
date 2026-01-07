// apps/api-nest/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { resolveDbDriver } from "@proj/infra";
import { getDrizzleDb } from "@proj/infra";
import { sql } from "drizzle-orm";

@Controller('health')
export class AppController {
    @Get('db')
    async db() {
        const driver = resolveDbDriver();
        if (driver === "memory") return { backend: "nest", driver, ok: true };

        try {
            if (driver === "mariadb") {
                const db = getDrizzleDb();
                await db.execute(sql`SELECT 1`);
            } else {
                const prisma = new PrismaClient();
                await prisma.$queryRaw`SELECT 1`;
                await prisma.$disconnect();
            }
            return { backend: "nest", driver, ok: true };
        } catch (e: any) {
            return { backend: "nest", driver, ok: false, message: e?.message ?? "db errors" };
        }
    }
}
