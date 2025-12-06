import { AccountRepository, AccountSummary, AccountType } from "../../domain/accounts/ports/AccountRepository";

type Input = { userId: string; name?: string; type?: AccountType };

export class CreateAccountForUserUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute({ userId, name, type }: Input): Promise<AccountSummary> {
        const accountName = name?.trim() || "Compte supplémentaire";
        const accountType = type ?? "CURRENT";
        return this.repo.createForUser({ userId, name: accountName, type: accountType });
    }
}
