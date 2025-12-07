import { SavingsInterestRepository } from "../../domain/accounts/ports/SavingsInterestRepository";
import { InterestRateProvider } from "../../domain/accounts/ports/InterestRateProvider";

export type InterestAccrualResult = {
    accountId: string;
    accrued: string;
};

export class ApplyDailySavingsInterestUseCase {
    constructor(
        private readonly repo: SavingsInterestRepository,
        private readonly rateProvider: InterestRateProvider,
    ) {}

    private formatAmount(amount: number): string {
        return amount.toFixed(2);
    }

    async execute(): Promise<InterestAccrualResult[]> {
        const rate = await this.rateProvider.getAnnualRate();
        if (!Number.isFinite(rate) || rate <= 0) return [];

        const dailyRate = rate / 365;
        const accounts = await this.repo.listActiveSavingsAccounts();
        const results: InterestAccrualResult[] = [];

        for (const acc of accounts) {
            const balance = Number(acc.balance);
            if (!Number.isFinite(balance) || balance <= 0) continue;

            const interest = balance * dailyRate;
            if (interest <= 0) continue;

            const amount = this.formatAmount(interest);
            await this.repo.creditInterest({
                accountId: acc.id,
                amount,
                note: "DAILY_INTEREST",
            });
            results.push({ accountId: acc.id, accrued: amount });
        }

        return results;
    }
}
