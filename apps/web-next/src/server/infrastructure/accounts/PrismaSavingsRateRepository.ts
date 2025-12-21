import { PrismaClient } from "@prisma/client";
import { SavingsRateRepository } from "../../domain/accounts/ports/SavingsRateRepository";

const DEFAULT_RATE_ID = "global-rate";

export class PrismaSavingsRateRepository implements SavingsRateRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async getActiveRate(): Promise<number | null> {
        const current = await this.prisma.tauxEpargne.findFirst({
            where: { active: true },
            orderBy: { updatedAt: "desc" },
        });
        if (!current) return null;
        const rateNumber = Number(current.rate);
        return Number.isFinite(rateNumber) ? rateNumber : null;
    }

    async saveRate(rate: number): Promise<void> {
        await this.prisma.tauxEpargne.upsert({
            where: { id: DEFAULT_RATE_ID },
            update: { rate, active: true },
            create: { id: DEFAULT_RATE_ID, rate, active: true },
        });
    }
}
