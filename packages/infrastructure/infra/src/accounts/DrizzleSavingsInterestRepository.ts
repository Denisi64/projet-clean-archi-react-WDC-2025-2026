import { and, eq, sql } from "drizzle-orm";
import { SavingsInterestRepository } from "@proj/domain/accounts/ports/SavingsInterestRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { accounts, operations } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleSavingsInterestRepository implements SavingsInterestRepository {
    async listActiveSavingsAccounts() {
        const db = getDrizzleDb();
        const rows = await db
            .select({ id: accounts.id, balance: accounts.balance, isActive: accounts.isActive })
            .from(accounts)
            .where(and(eq(accounts.type, "SAVINGS"), eq(accounts.isActive, true)));
        return rows.map((a) => ({ id: a.id, balance: a.balance.toString(), isActive: !!a.isActive }));
    }

    async creditInterest(input: { accountId: string; amount: string; note?: string }) {
        const db = getDrizzleDb();
        await db.transaction(async (tx) => {
            await tx.insert(operations).values({
                id: newId(),
                accountId: input.accountId,
                kind: "CREDIT",
                amount: input.amount,
                metadata: input.note ?? "DAILY_INTEREST",
            });

            await tx
                .update(accounts)
                .set({ balance: sql`${accounts.balance} + ${input.amount}` })
                .where(eq(accounts.id, input.accountId));
        });
    }
}
