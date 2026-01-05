import { SavingsRateRepository } from "@proj/domain/accounts/ports/SavingsRateRepository";
import { SavingsRateNotifier } from "./ports/SavingsRateNotifier";
import { Result, err, ok } from "../Result";

type Input = {
    actorRole: "DIRECTOR" | "ADVISOR" | "CLIENT";
    rate: number;
};
type UpdateSavingsRateError = "FORBIDDEN" | "INVALID_RATE" | Error;

export class UpdateSavingsRateUseCase {
    constructor(
        private readonly rateRepo: SavingsRateRepository,
        private readonly notifier: SavingsRateNotifier = { notifyRateChanged: async () => {} },
    ) {}

    async execute(input: Input): Promise<Result<{ rate: number }, UpdateSavingsRateError>> {
        if (input.actorRole !== "DIRECTOR") {
            return err("FORBIDDEN");
        }

        const rate = input.rate;
        if (!Number.isFinite(rate) || rate <= 0 || rate > 0.5) {
            return err("INVALID_RATE");
        }

        try {
            await this.rateRepo.saveRate(rate);
            await this.notifier.notifyRateChanged(rate);
            return ok({ rate });
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("SAVINGS_RATE_UPDATE_FAILED"));
        }
    }
}
