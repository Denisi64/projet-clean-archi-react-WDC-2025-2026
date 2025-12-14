import { CreditRepository, CreditDetail } from "../../domain/credits/ports/CreditRepository";

export class ListCreditsForUserUseCase {
    constructor(private readonly repo: CreditRepository) {}

    async execute(userId: string): Promise<CreditDetail[]> {
        if (!userId.trim()) return [];
        return this.repo.listByUser(userId);
    }
}
