import { AccountRepository, AccountSummary, AccountType } from "../../domain/accounts/ports/AccountRepository";
import { Result, err, ok } from "../Result";
import { AccountIbanAllocationError } from "../../domain/accounts/errors/AccountIbanAllocationError";

type Input = { userId: string; name?: string; type?: AccountType };
type CreateAccountError = AccountIbanAllocationError | Error;

export class CreateAccountForUserUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute({ userId, name, type }: Input): Promise<Result<AccountSummary, CreateAccountError>> {
        const accountName = name?.trim() || "Compte supplémentaire";
        const accountType = type ?? "CURRENT";
        try {
            const account = await this.repo.createForUser({ userId, name: accountName, type: accountType });
            return ok(account);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACCOUNT_CREATE_FAILED"));
        }
    }
}
