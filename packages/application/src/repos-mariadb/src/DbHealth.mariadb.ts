import { PrismaClient } from '@proj/infrastructure/shared-prisma';
import type { DbHealthPort } from '@proj/application/src/ports/DbHealth.port';

const prisma = new PrismaClient();

export class MariadbDbHealthAdapter implements DbHealthPort {
    driver() { return 'mariadb' as const; }
    async ping() {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { ok: true };
        } catch (e:any) {
            return { ok: false, message: e?.message ?? 'mariadb errors' };
        }
    }
}
