import { SavingsRateRepository } from "../../domain/accounts/ports/SavingsRateRepository";

type Input = {
    actorRole: "DIRECTOR" | "ADVISOR" | "CLIENT";
    rate: number;
};

export class UpdateSavingsRateUseCase {
    constructor(private readonly rateRepo: SavingsRateRepository) {}

    async execute(input: Input) {
        if (input.actorRole !== "DIRECTOR") {
            return { ok: false as const, code: "FORBIDDEN" as const };
        }

        const rate = input.rate;
        if (!Number.isFinite(rate) || rate <= 0 || rate > 0.5) {
            return { ok: false as const, code: "INVALID_RATE" as const };
        }

        await this.rateRepo.saveRate(rate);
        return { ok: true as const, rate };
    }
}
