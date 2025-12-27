import { SavingsRateRepository } from "../../domain/accounts/ports/SavingsRateRepository";
import { Result, err, ok } from "../Result";

export class GetActiveSavingsRateUseCase {
    constructor(private readonly rateRepo: SavingsRateRepository) {}

    async execute(): Promise<Result<number | null, Error>> {
        try {
            const rate = await this.rateRepo.getActiveRate();
            if (rate === null) return ok(null);
            if (!Number.isFinite(rate) || rate < 0) return ok(null);
            return ok(rate);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("SAVINGS_RATE_FETCH_FAILED"));
        }
    }
}
