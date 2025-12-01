// src/server/infrastructure/auth/PrismaAuthRepository.ts

import { Prisma, PrismaClient } from "@prisma/client";
import {
    AuthRepository,
    AuthUser,
    CreateUserInput,
} from "../../domain/auth/ports/AuthRepository";

const prisma = new PrismaClient();

export class PrismaAuthRepository implements AuthRepository {
    private mapUser(u: any): AuthUser {
        const passwordHash = (u as any).password ?? (u as any).passwordHash;

        return {
            id: u.id,
            email: u.email,
            passwordHash,
            isActive: !!u.isActive,
            confirmationToken: u.confirmationToken ?? null,
            confirmationTokenExpiresAt: u.confirmationTokenExpiresAt ?? null,
        };
    }

    async findByEmail(email: string): Promise<AuthUser | null> {
        const u = await prisma.user.findUnique({ where: { email } });
        if (!u) return null;

        return this.mapUser(u);
    }

    async findByConfirmationToken(token: string): Promise<AuthUser | null> {
        const u = await prisma.user.findUnique({ where: { confirmationToken: token } });
        if (!u) return null;
        return this.mapUser(u);
    }

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

    private async generateUniqueIban(client: PrismaClient | Prisma.TransactionClient): Promise<string> {
        for (let i = 0; i < 8; i++) {
            const candidate = this.buildIbanCandidate();
            const exists = await client.account.findUnique({ where: { iban: candidate } });
            if (!exists) return candidate;
        }
        throw new Error("ACCOUNT_IBAN_ALLOCATION_FAILED");
    }

    async createUser(data: CreateUserInput): Promise<AuthUser> {
        const { user } = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email: data.email,
                    // ton modèle a "password", donc on écrit dedans :
                    password: data.passwordHash,
                    // "name" est obligatoire dans Prisma, on met soit celui fourni,
                    // soit un fallback simple (ici la partie avant le @ de l’email)
                    name: data.name ?? data.email.split("@")[0],
                    isActive: data.isActive ?? false,
                    confirmationToken: data.confirmationToken ?? null,
                    confirmationTokenExpiresAt: data.confirmationTokenExpiresAt ?? null,
                },
            });

            const iban = await this.generateUniqueIban(tx);
            await tx.account.create({
                data: {
                    userId: created.id,
                    iban,
                    name: "Compte Courant",
                    type: "CURRENT",
                    balance: "0.00",
                },
            });

            return { user: created };
        });

        return this.mapUser(user);
    }

    async confirmUser(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: true,
                confirmationToken: null,
                confirmationTokenExpiresAt: null,
            },
        });
    }
}
