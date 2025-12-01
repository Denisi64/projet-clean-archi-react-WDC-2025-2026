// apps/api-nest/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('health')
export class AppController {
    @Get('db')
    async db() {
        const driver = process.env.DB_DRIVER;
        if (driver === 'memory') return { backend: 'nest', driver, ok: true };
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { backend: 'nest', driver, ok: true };
        } catch (e: any) {
            return { backend: 'nest', driver, ok: false, message: e?.message ?? 'db errors' };
        }
    }
}
