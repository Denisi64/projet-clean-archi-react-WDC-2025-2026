import { AccountRepository, AccountSummary } from "../../domain/accounts/ports/AccountRepository";

export class GetUserAccountsUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(userId: string): Promise<AccountSummary[]> {
        return this.repo.findByUserId(userId);
    }
}
