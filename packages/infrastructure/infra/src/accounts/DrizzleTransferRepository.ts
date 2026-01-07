import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import {
    TransferAccount,
    TransferRepository,
    TransferResult,
    TransferHistoryItem,
} from "@proj/domain/accounts/ports/TransferRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { accounts, operations, transfers } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleTransferRepository implements TransferRepository {
    private toAccount(acc: any): TransferAccount {
        return {
            id: acc.id,
            userId: acc.userId,
            name: acc.name,
            iban: acc.iban,
            type: acc.type as TransferAccount["type"],
            balance: acc.balance.toString(),
            isActive: !!acc.isActive,
            createdAt: acc.createdAt,
        };
    }

    async findAccountById(id: string): Promise<TransferAccount | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
        return rows[0] ? this.toAccount(rows[0]) : null;
    }

    async findAccountByIban(iban: string): Promise<TransferAccount | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(accounts).where(eq(accounts.iban, iban)).limit(1);
        return rows[0] ? this.toAccount(rows[0]) : null;
    }

    async executeTransfer(input: {
        sourceAccountId: string;
        destinationAccountId: string;
        amount: string;
        note?: string | undefined;
    }): Promise<TransferResult> {
        const db = getDrizzleDb();
        const transferId = newId();
        const debitId = newId();
        const creditId = newId();

        await db.transaction(async (tx) => {
            await tx.insert(transfers).values({
                id: transferId,
                sourceAccountId: input.sourceAccountId,
                destAccountId: input.destinationAccountId,
                amount: input.amount,
                note: input.note ?? null,
            });

            await tx.insert(operations).values([
                {
                    id: debitId,
                    accountId: input.sourceAccountId,
                    kind: "DEBIT",
                    amount: input.amount,
                    transferId,
                    metadata: input.note ?? null,
                },
                {
                    id: creditId,
                    accountId: input.destinationAccountId,
                    kind: "CREDIT",
                    amount: input.amount,
                    transferId,
                    metadata: input.note ?? null,
                },
            ]);

            await tx
                .update(accounts)
                .set({ balance: sql`${accounts.balance} - ${input.amount}` })
                .where(eq(accounts.id, input.sourceAccountId));
            await tx
                .update(accounts)
                .set({ balance: sql`${accounts.balance} + ${input.amount}` })
                .where(eq(accounts.id, input.destinationAccountId));
        });

        const [sourceRow, destRow] = await Promise.all([
            db.select().from(accounts).where(eq(accounts.id, input.sourceAccountId)).limit(1),
            db.select().from(accounts).where(eq(accounts.id, input.destinationAccountId)).limit(1),
        ]);

        return {
            transferId,
            source: this.toAccount(sourceRow[0]),
            destination: this.toAccount(destRow[0]),
        };
    }

    async listForUser({ userId, accountId }: { userId: string; accountId?: string }): Promise<TransferHistoryItem[]> {
        const db = getDrizzleDb();
        const userAccounts = await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(eq(accounts.userId, userId));
        const userAccountIds = userAccounts.map((a) => a.id);
        if (userAccountIds.length === 0) return [];

        const scopedAccountIds = accountId ? userAccountIds.filter((id) => id === accountId) : userAccountIds;
        if (scopedAccountIds.length === 0) return [];

        const transfersRows = await db
            .select()
            .from(transfers)
            .where(
                or(
                    inArray(transfers.sourceAccountId, scopedAccountIds),
                    inArray(transfers.destAccountId, scopedAccountIds),
                ),
            )
            .orderBy(desc(transfers.createdAt));

        const accountIds = Array.from(
            new Set(transfersRows.flatMap((t) => [t.sourceAccountId, t.destAccountId])),
        );
        const accountRows = await db
            .select()
            .from(accounts)
            .where(inArray(accounts.id, accountIds));
        const accountById = new Map(accountRows.map((acc) => [acc.id, this.toAccount(acc)]));

        return transfersRows.map((t) => {
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
