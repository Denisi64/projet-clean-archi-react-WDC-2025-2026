import { SavingsRateRepository } from "../../domain/accounts/ports/SavingsRateRepository";
import { SavingsRateNotifier } from "./ports/SavingsRateNotifier";

type Input = {
    actorRole: "DIRECTOR" | "ADVISOR" | "CLIENT";
    rate: number;
};

export class UpdateSavingsRateUseCase {
    constructor(
        private readonly rateRepo: SavingsRateRepository,
        private readonly notifier: SavingsRateNotifier = { notifyRateChanged: async () => {} },
    ) {}

    async execute(input: Input) {
        if (input.actorRole !== "DIRECTOR") {
            return { ok: false as const, code: "FORBIDDEN" as const };
        }

        const rate = input.rate;
        if (!Number.isFinite(rate) || rate <= 0 || rate > 0.5) {
            return { ok: false as const, code: "INVALID_RATE" as const };
        }

        await this.rateRepo.saveRate(rate);
        await this.notifier.notifyRateChanged(rate);
        return { ok: true as const, rate };
    }
}
