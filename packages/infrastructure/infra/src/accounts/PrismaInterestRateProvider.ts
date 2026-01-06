import { InterestRateProvider } from "@proj/domain/accounts/ports/InterestRateProvider";
import { SavingsRateRepository } from "@proj/domain/accounts/ports/SavingsRateRepository";

export class PrismaInterestRateProvider implements InterestRateProvider {
    constructor(private readonly rateRepo: SavingsRateRepository) {}

    async getAnnualRate(): Promise<number> {
        const stored = await this.rateRepo.getActiveRate();
        if (stored !== null && stored >= 0) return stored;

        const fallback = Number(process.env.SAVINGS_INTEREST_RATE ?? "0.02");
        return Number.isFinite(fallback) && fallback >= 0 ? fallback : 0;
    }
}
