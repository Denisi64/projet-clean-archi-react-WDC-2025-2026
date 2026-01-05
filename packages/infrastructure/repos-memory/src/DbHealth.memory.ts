import type { DbHealthPort } from "@proj/application/ports/DbHealth.port";

export class MemoryDbHealthAdapter implements DbHealthPort {
    driver() { return 'memory' as const; }
    async ping() { return { ok: true }; }
}
