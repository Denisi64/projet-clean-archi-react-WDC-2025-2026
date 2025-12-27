import { SavingsInterestRepository } from "../../domain/accounts/ports/SavingsInterestRepository";
import { InterestRateProvider } from "../../domain/accounts/ports/InterestRateProvider";
import { Result, err, ok } from "../Result";

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

    async execute(options?: { mode?: "daily" | "annual" }): Promise<Result<InterestAccrualResult[], Error>> {
        try {
            const rate = await this.rateProvider.getAnnualRate();
            if (!Number.isFinite(rate) || rate <= 0) return ok([]);

            const mode = options?.mode === "annual" ? "annual" : "daily";
            const note = mode === "annual" ? "ANNUAL_INTEREST" : "DAILY_INTEREST";
            const effectiveRate = mode === "annual" ? rate : rate / 365;
            const accounts = await this.repo.listActiveSavingsAccounts();
            const results: InterestAccrualResult[] = [];

            for (const acc of accounts) {
                const balance = Number(acc.balance);
                if (!Number.isFinite(balance) || balance <= 0) continue;

                const interest = balance * effectiveRate;
                if (interest <= 0) continue;

                const amount = this.formatAmount(interest);
                await this.repo.creditInterest({
                    accountId: acc.id,
                    amount,
                    note,
                });
                results.push({ accountId: acc.id, accrued: amount });
            }

            return ok(results);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("INTEREST_APPLY_FAILED"));
        }
    }
}
