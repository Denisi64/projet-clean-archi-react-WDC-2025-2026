import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
    @Get('db')
    async healthDb() {
        const driver =
            process.env.DB_DRIVER ??
            (process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' :
                process.env.DATABASE_URL?.startsWith('mysql')    ? 'mariadb'  :
                    'unknown');

        if (driver === 'memory' || !process.env.DATABASE_URL) {
            return { status: 'ok', driver, db: 'skipped (memory/no URL)' };
        }

        const prisma = new PrismaClient();
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { status: 'ok', driver, db: 'connected' };
        } catch (e: any) {
            return { status: 'error', driver, db: 'unreachable', error: e?.message ?? String(e) };
        } finally {
            await prisma.$disconnect();
        }
    }
}
