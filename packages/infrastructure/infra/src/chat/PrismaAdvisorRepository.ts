import { PrismaClient } from "@prisma/client";
import { Advisor, AdvisorRepository } from "@proj/domain/chat/ports/AdvisorRepository";

export class PrismaAdvisorRepository implements AdvisorRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async findAllAdvisors(): Promise<Advisor[]> {
        const rows = await this.prisma.user.findMany({
            where: { role: "ADVISOR" },
            orderBy: { createdAt: "asc" },
            select: { id: true, email: true, role: true },
        });

        return rows.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
        }));
    }
}
