import { AccountRepository, AccountSummary } from "@proj/domain/accounts/ports/AccountRepository";
import { Result, err, ok } from "../Result";

export class GetUserAccountsUseCase {
    constructor(private readonly repo: AccountRepository) {}

    async execute(userId: string): Promise<Result<AccountSummary[], Error>> {
        try {
            const accounts = await this.repo.findByUserId(userId);
            return ok(accounts);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACCOUNTS_FETCH_FAILED"));
        }
    }
}
