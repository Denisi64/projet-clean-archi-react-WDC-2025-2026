import { SavingsRateRepository } from "../../domain/accounts/ports/SavingsRateRepository";

export class GetActiveSavingsRateUseCase {
    constructor(private readonly rateRepo: SavingsRateRepository) {}

    async execute(): Promise<number | null> {
        const rate = await this.rateRepo.getActiveRate();
        if (rate === null) return null;
        if (!Number.isFinite(rate) || rate < 0) return null;
        return rate;
    }
}
