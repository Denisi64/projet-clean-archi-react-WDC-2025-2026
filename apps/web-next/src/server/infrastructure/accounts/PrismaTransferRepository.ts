import { Account, Prisma, PrismaClient } from "@prisma/client";
import {
    TransferAccount,
    TransferRepository,
    TransferResult,
    TransferHistoryItem,
} from "../../domain/accounts/ports/TransferRepository";

export class PrismaTransferRepository implements TransferRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private toAccount(acc: Account): TransferAccount {
        return {
            id: acc.id,
            userId: acc.userId,
            name: acc.name,
            iban: acc.iban,
            type: acc.type,
            balance: acc.balance.toString(),
            isActive: acc.isActive,
            createdAt: acc.createdAt,
        };
    }

    async findAccountById(id: string): Promise<TransferAccount | null> {
        const acc = await this.prisma.account.findUnique({ where: { id } });
        return acc ? this.toAccount(acc) : null;
    }

    async findAccountByIban(iban: string): Promise<TransferAccount | null> {
        const acc = await this.prisma.account.findUnique({ where: { iban } });
        return acc ? this.toAccount(acc) : null;
    }

    async executeTransfer(input: {
        sourceAccountId: string;
        destinationAccountId: string;
        amount: string;
        note?: string | undefined;
    }): Promise<TransferResult> {
        const amount = new Prisma.Decimal(input.amount);

        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.transfer.create({
                data: {
                    sourceAccountId: input.sourceAccountId,
                    destAccountId: input.destinationAccountId,
                    amount,
                    note: input.note,
                },
            });

            await tx.operation.createMany({
                data: [
                    {
                        accountId: input.sourceAccountId,
                        kind: "DEBIT",
                        amount,
                        transferId: transfer.id,
                        metadata: input.note,
                    },
                    {
                        accountId: input.destinationAccountId,
                        kind: "CREDIT",
                        amount,
                        transferId: transfer.id,
                        metadata: input.note,
                    },
                ],
            });

            const [updatedSource, updatedDestination] = await Promise.all([
                tx.account.update({
                    where: { id: input.sourceAccountId },
                    data: {
                        balance: { decrement: amount },
                    },
                }),
                tx.account.update({
                    where: { id: input.destinationAccountId },
                    data: {
                        balance: { increment: amount },
                    },
                }),
            ]);

            return {
                transferId: transfer.id,
                source: this.toAccount(updatedSource),
                destination: this.toAccount(updatedDestination),
            };
        });
    }

    async listForUser({ userId, accountId }: { userId: string; accountId?: string }): Promise<TransferHistoryItem[]> {
        const userAccounts = await this.prisma.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const userAccountIds = userAccounts.map((a) => a.id);
        if (userAccountIds.length === 0) return [];

        const scopedAccountIds = accountId ? userAccountIds.filter((id) => id === accountId) : userAccountIds;
        if (scopedAccountIds.length === 0) return [];

        const transfers = await this.prisma.transfer.findMany({
            where: {
                OR: [
                    { sourceAccountId: { in: scopedAccountIds } },
                    { destAccountId: { in: scopedAccountIds } },
                ],
            },
            orderBy: { createdAt: "desc" },
        });

        const accountIds = Array.from(
            new Set(transfers.flatMap((t) => [t.sourceAccountId, t.destAccountId])),
        );

        const accounts = await this.prisma.account.findMany({
            where: { id: { in: accountIds } },
        });
        const accountById = new Map(accounts.map((acc) => [acc.id, this.toAccount(acc)]));

        return transfers.map((t) => {
            const source = accountById.get(t.sourceAccountId)!;
            const destination = accountById.get(t.destAccountId)!;

            let direction: "IN" | "OUT" = "OUT";
            if (accountId) {
                direction = t.sourceAccountId === accountId ? "OUT" : "IN";
            } else if (destination.userId === userId && source.userId !== userId) {
                direction = "IN";
            }

            return {
                id: t.id,
                source,
                destination,
                amount: t.amount.toString(),
                note: t.note ?? undefined,
                createdAt: t.createdAt,
                direction,
            };
        });
    }
}
