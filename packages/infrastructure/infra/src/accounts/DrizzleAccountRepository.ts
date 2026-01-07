import { and, eq, asc } from "drizzle-orm";
import { AccountRepository, AccountSummary } from "@proj/domain/accounts/ports/AccountRepository";
import { AccountNotFoundError } from "@proj/domain/accounts/errors/AccountNotFoundError";
import { AccountIbanAllocationError } from "@proj/domain/accounts/errors/AccountIbanAllocationError";
import { AccountType } from "@proj/domain/accounts/AccountType";
import { getDrizzleDb } from "../db/drizzle/client";
import { accounts } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleAccountRepository implements AccountRepository {
    private randomDigits(length: number): string {
        return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
    }

    private mod97(numberString: string): number {
        let remainder = 0;
        for (const digit of numberString) {
            remainder = (remainder * 10 + Number(digit)) % 97;
        }
        return remainder;
    }

    private computeRibKey(bankCode: string, branchCode: string, accountNumber: string): string {
        const base = `${bankCode}${branchCode}${accountNumber}`;
        const remainder = this.mod97(base);
        const key = 97 - remainder;
        return key === 0 ? "97" : key.toString().padStart(2, "0");
    }

    private computeIban(bankCode: string, branchCode: string, accountNumber: string, ribKey: string): string {
        const bban = `${bankCode}${branchCode}${accountNumber}${ribKey}`;
        const numeric = `${bban}152700`;
        const remainder = this.mod97(numeric);
        const checkDigits = (98 - remainder).toString().padStart(2, "0");
        return `FR${checkDigits}${bban}`;
    }

    private async generateUniqueIban(): Promise<string> {
        const db = getDrizzleDb();
        for (let i = 0; i < 8; i++) {
            const bankCode = "30006";
            const branchCode = "00001";
            const accountNumber = `${Date.now()}${this.randomDigits(5)}`.slice(-11);
            const ribKey = this.computeRibKey(bankCode, branchCode, accountNumber);
            const candidate = this.computeIban(bankCode, branchCode, accountNumber, ribKey);
            const exists = await db
                .select({ id: accounts.id })
                .from(accounts)
                .where(eq(accounts.iban, candidate))
                .limit(1);
            if (exists.length === 0) return candidate;
        }
        throw new AccountIbanAllocationError();
    }

    private toSummary(acc: any): AccountSummary {
        return {
            id: acc.id,
            name: acc.name,
            iban: acc.iban,
            type: acc.type as AccountSummary["type"],
            balance: acc.balance.toString(),
            isActive: !!acc.isActive,
            createdAt: acc.createdAt,
        };
    }

    async findByUserId(userId: string): Promise<AccountSummary[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, userId))
            .orderBy(asc(accounts.createdAt));
        return rows.map((acc) => this.toSummary(acc));
    }

    async createForUser(input: { userId: string; name: string; type: AccountType }): Promise<AccountSummary> {
        const db = getDrizzleDb();
        const iban = await this.generateUniqueIban();
        const id = newId();
        await db.insert(accounts).values({
            id,
            userId: input.userId,
            name: input.name,
            type: input.type,
            iban,
            balance: "0.00",
            isActive: true,
        });
        const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
        return this.toSummary(rows[0]);
    }

    async rename(input: { accountId: string; userId: string; name: string }): Promise<AccountSummary> {
        const db = getDrizzleDb();
        const rows = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);
        const account = rows[0];
        if (!account || account.userId !== input.userId) {
            throw new AccountNotFoundError();
        }
        await db.update(accounts).set({ name: input.name }).where(eq(accounts.id, input.accountId));
        const updated = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);
        return this.toSummary(updated[0]);
    }

    async close(input: { accountId: string; userId: string }): Promise<AccountSummary> {
        const db = getDrizzleDb();
        const rows = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);
        const account = rows[0];
        if (!account || account.userId !== input.userId) {
            throw new AccountNotFoundError();
        }
        if (!account.isActive) {
            return this.toSummary(account);
        }
        await db.update(accounts).set({ isActive: false }).where(eq(accounts.id, input.accountId));
        const updated = await db.select().from(accounts).where(eq(accounts.id, input.accountId)).limit(1);
        return this.toSummary(updated[0]);
    }
}
