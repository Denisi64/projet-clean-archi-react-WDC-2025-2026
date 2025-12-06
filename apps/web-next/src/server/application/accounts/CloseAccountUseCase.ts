import { AccountRepository, AccountSummary } from "../../domain/accounts/ports/AccountRepository";

type Input = { accountId: string; userId: string };

export class CloseAccountUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(input: Input): Promise<AccountSummary> {
        return this.repo.close(input);
    }
}
