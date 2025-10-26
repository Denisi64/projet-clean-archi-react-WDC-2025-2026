import { PrismaClient } from '@proj/infrastructure/shared-prisma';
import type { DbHealthPort } from '@proj/application/src/ports/DbHealth.port';

const prisma = new PrismaClient();

export class PostgresDbHealthAdapter implements DbHealthPort {
    driver() { return 'postgres' as const; }
    async ping() {
        try {
            // Simple round-trip
            await prisma.$queryRaw`SELECT 1`;
            return { ok: true };
        } catch (e:any) {
            return { ok: false, message: e?.message ?? 'pg error' };
        }
    }
}
