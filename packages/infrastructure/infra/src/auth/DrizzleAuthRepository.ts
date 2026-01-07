import { and, eq } from "drizzle-orm";
import { getDrizzleDb } from "../db/drizzle/client";
import { accounts, users } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";
import {
    AuthRepository,
    AuthUser,
    CreateUserInput,
} from "@proj/domain/auth/ports/AuthRepository";
import { AccountIbanAllocationError } from "@proj/domain/accounts/errors/AccountIbanAllocationError";

type DrizzleAuthRepositoryOptions = {
    createDefaultAccount?: boolean;
};

export class DrizzleAuthRepository implements AuthRepository {
    private readonly createDefaultAccount: boolean;

    constructor(options: DrizzleAuthRepositoryOptions = {}) {
        this.createDefaultAccount = options.createDefaultAccount ?? false;
    }

    private mapUser(u: any): AuthUser {
        const passwordHash = (u as any).password ?? (u as any).passwordHash;
        return {
            id: u.id,
            email: u.email,
            passwordHash,
            isActive: !!u.isActive,
            name: u.name ?? undefined,
            role: u.role ?? undefined,
            bannedAt: u.bannedAt ?? null,
            confirmationToken: u.confirmationToken ?? null,
            confirmationTokenExpiresAt: u.confirmationTokenExpiresAt ?? null,
        };
    }

    async findById(id: string): Promise<AuthUser | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }

    async findByEmail(email: string): Promise<AuthUser | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }

    async findByConfirmationToken(token: string): Promise<AuthUser | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(users)
            .where(eq(users.confirmationToken, token))
            .limit(1);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }

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
            const accountNumber = `${Date.now()}${this.randomDigits(4)}`.slice(-11);
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

    async createUser(data: CreateUserInput): Promise<AuthUser> {
        const db = getDrizzleDb();
        const userId = newId();
        const displayName = data.name ?? data.email.split("@")[0];

        const created = await db.transaction(async (tx) => {
            await tx.insert(users).values({
                id: userId,
                email: data.email,
                password: data.passwordHash,
                name: displayName,
                isActive: data.isActive ?? false,
                confirmationToken: data.confirmationToken ?? null,
                confirmationTokenExpiresAt: data.confirmationTokenExpiresAt ?? null,
            });

            if (this.createDefaultAccount) {
                const iban = await this.generateUniqueIban();
                await tx.insert(accounts).values({
                    id: newId(),
                    userId,
                    iban,
                    name: "Compte Courant",
                    type: "CURRENT",
                    balance: "0.00",
                    isActive: true,
                });
            }

            const rows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
            return rows[0];
        });

        return this.mapUser(created);
    }

    async confirmUser(userId: string): Promise<void> {
        const db = getDrizzleDb();
        await db
            .update(users)
            .set({
                isActive: true,
                confirmationToken: null,
                confirmationTokenExpiresAt: null,
            })
            .where(eq(users.id, userId));
    }
}
