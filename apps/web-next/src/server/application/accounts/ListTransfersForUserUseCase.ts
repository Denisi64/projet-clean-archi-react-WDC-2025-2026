import { TransferHistoryItem, TransferRepository } from "../../domain/accounts/ports/TransferRepository";
import { AccountNotFoundError } from "../../domain/accounts/errors/AccountNotFoundError";
import { Result, err, ok } from "../Result";

export class ListTransfersForUserUseCase {
    constructor(private readonly repo: TransferRepository) {}

    async execute(
        userId: string,
        accountId?: string,
    ): Promise<Result<TransferHistoryItem[], AccountNotFoundError | Error>> {
        try {
            if (accountId) {
                const account = await this.repo.findAccountById(accountId);
                if (!account || account.userId !== userId) {
                    return err(new AccountNotFoundError());
                }
            }
            const history = await this.repo.listForUser({ userId, accountId });
            return ok(history);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("TRANSFER_HISTORY_FAILED"));
        }
    }
}
