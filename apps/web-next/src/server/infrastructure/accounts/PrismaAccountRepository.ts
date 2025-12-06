import { Account, AccountType as PrismaAccountType, PrismaClient } from "@prisma/client";
import {
    AccountRepository,
    AccountSummary,
    AccountType,
} from "../../domain/accounts/ports/AccountRepository";

export class PrismaAccountRepository implements AccountRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private randomDigits(length: number): string {
        return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
    }

    private buildIbanCandidate(): string {
        const bankCode = "30006";
        const branchCode = "00001";
        const accountNumber = `${Date.now()}${this.randomDigits(4)}`.slice(-11);
        const controlKey = this.randomDigits(2);
        return `FR76${bankCode}${branchCode}${accountNumber}${controlKey}`;
    }

    private async generateUniqueIban(client: PrismaClient): Promise<string> {
        for (let i = 0; i < 8; i++) {
            const candidate = this.buildIbanCandidate();
            const exists = await client.account.findUnique({ where: { iban: candidate } });
            if (!exists) return candidate;
        }
        throw new Error("ACCOUNT_IBAN_ALLOCATION_FAILED");
    }

    private toSummary(acc: Account): AccountSummary {
        return {
            id: acc.id,
            name: acc.name,
            iban: acc.iban,
            type: acc.type as AccountSummary["type"],
            balance: acc.balance.toString(),
            isActive: acc.isActive,
            createdAt: acc.createdAt,
        };
    }

    async findByUserId(userId: string): Promise<AccountSummary[]> {
        const accounts = await this.prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        });

        return accounts.map((acc) => this.toSummary(acc));
    }

    async createForUser(input: { userId: string; name: string; type: AccountType }): Promise<AccountSummary> {
        const iban = await this.generateUniqueIban(this.prisma);
        const created = await this.prisma.account.create({
            data: {
                userId: input.userId,
                name: input.name,
                type: input.type as PrismaAccountType,
                iban,
                balance: "0.00",
                isActive: true,
            },
        });

        return this.toSummary(created);
    }

    async rename(input: { accountId: string; userId: string; name: string }): Promise<AccountSummary> {
        const account = await this.prisma.account.findUnique({ where: { id: input.accountId } });
        if (!account || account.userId !== input.userId) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }

        const updated = await this.prisma.account.update({
            where: { id: input.accountId },
            data: { name: input.name },
        });

        return this.toSummary(updated);
    }

    async close(input: { accountId: string; userId: string }): Promise<AccountSummary> {
        const account = await this.prisma.account.findUnique({ where: { id: input.accountId } });
        if (!account || account.userId !== input.userId) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }

        if (!account.isActive) {
            return this.toSummary(account);
        }

        const updated = await this.prisma.account.update({
            where: { id: input.accountId },
            data: { isActive: false },
        });

        return this.toSummary(updated);
    }
}
