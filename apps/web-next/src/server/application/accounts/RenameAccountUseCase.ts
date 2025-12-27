import { AccountRepository, AccountSummary } from "../../domain/accounts/ports/AccountRepository";
import { Result, err, ok } from "../Result";
import { AccountNotFoundError } from "../../domain/accounts/errors/AccountNotFoundError";

type Input = { accountId: string; userId: string; name: string };
type RenameAccountError = AccountNotFoundError | Error;

export class RenameAccountUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(input: Input): Promise<Result<AccountSummary, RenameAccountError>> {
        const trimmedName = input.name.trim();
        try {
            const account = await this.repo.rename({ ...input, name: trimmedName });
            return ok(account);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACCOUNT_RENAME_FAILED"));
        }
    }
}
