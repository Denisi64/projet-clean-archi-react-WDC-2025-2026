import { AccountRepository, AccountSummary } from "@proj/domain/accounts/ports/AccountRepository";
import { AccountType } from "@proj/domain/accounts/AccountType";
import { Result, err, ok } from "../Result";
import { AccountIbanAllocationError } from "@proj/domain/accounts/errors/AccountIbanAllocationError";

type Input = { userId: string; name?: string; type?: AccountType };
type CreateAccountError = AccountIbanAllocationError | Error;

export class CreateAccountForUserUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute({ userId, name, type }: Input): Promise<Result<AccountSummary, CreateAccountError>> {
        const accountName = name?.trim() || "Compte supplémentaire";
        const accountType = type ?? AccountType.CURRENT;
        try {
            const account = await this.repo.createForUser({ userId, name: accountName, type: accountType });
            return ok(account);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACCOUNT_CREATE_FAILED"));
        }
    }
}
