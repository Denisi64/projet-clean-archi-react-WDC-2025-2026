import { AccountRepository, AccountSummary } from "../../domain/accounts/ports/AccountRepository";
import { Result, err, ok } from "../Result";
import { AccountNotFoundError } from "../../domain/accounts/errors/AccountNotFoundError";

type Input = { accountId: string; userId: string };
type CloseAccountError = AccountNotFoundError | Error;

export class CloseAccountUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(input: Input): Promise<Result<AccountSummary, CloseAccountError>> {
        try {
            const account = await this.repo.close(input);
            return ok(account);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACCOUNT_CLOSE_FAILED"));
        }
    }
}
