import { InterestRateProvider } from "../../domain/accounts/ports/InterestRateProvider";

export class EnvInterestRateProvider implements InterestRateProvider {
    async getAnnualRate(): Promise<number> {
        const raw = process.env.SAVINGS_INTEREST_RATE ?? "0.02"; // 2% par défaut
        const rate = Number(raw);
        if (!Number.isFinite(rate) || rate < 0) return 0;
        return rate;
    }
}
