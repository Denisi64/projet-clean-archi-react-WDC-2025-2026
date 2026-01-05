import { CreditRepository, CreditDetail } from "@proj/domain/credits/ports/CreditRepository";
import { Result, err, ok } from "../Result";

export class ListCreditsForUserUseCase {
    constructor(private readonly repo: CreditRepository) {}

    async execute(userId: string): Promise<Result<CreditDetail[], Error>> {
        if (!userId.trim()) return ok([]);
        try {
            const credits = await this.repo.listByUser(userId);
            return ok(credits);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("CREDITS_FETCH_FAILED"));
        }
    }
}
