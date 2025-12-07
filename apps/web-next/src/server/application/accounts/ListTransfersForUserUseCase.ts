import { TransferHistoryItem, TransferRepository } from "../../domain/accounts/ports/TransferRepository";
import { AccountNotFoundError } from "../../domain/accounts/errors/AccountNotFoundError";

export class ListTransfersForUserUseCase {
    constructor(private readonly repo: TransferRepository) {}

    async execute(userId: string, accountId?: string): Promise<TransferHistoryItem[]> {
        if (accountId) {
            const account = await this.repo.findAccountById(accountId);
            if (!account || account.userId !== userId) {
                throw new AccountNotFoundError();
            }
        }
        return this.repo.listForUser({ userId, accountId });
    }
}
