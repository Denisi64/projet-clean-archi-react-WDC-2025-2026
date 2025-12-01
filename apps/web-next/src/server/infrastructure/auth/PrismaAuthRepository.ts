// src/server/infrastructure/auth/PrismaAuthRepository.ts

import { PrismaClient } from "@prisma/client";
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

    async createUser(data: CreateUserInput): Promise<AuthUser> {
        const created = await prisma.user.create({
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

        return this.mapUser(created);
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
