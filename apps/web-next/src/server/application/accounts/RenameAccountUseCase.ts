import { AccountRepository, AccountSummary } from "../../domain/accounts/ports/AccountRepository";

type Input = { accountId: string; userId: string; name: string };

export class RenameAccountUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(input: Input): Promise<AccountSummary> {
        const trimmedName = input.name.trim();
        return this.repo.rename({ ...input, name: trimmedName });
    }
}
