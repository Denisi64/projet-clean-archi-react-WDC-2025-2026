// src/server/infrastructure/auth/PrismaAuthRepository.ts

import { PrismaClient } from "@prisma/client";
import {
    AuthRepository,
    AuthUser,
    CreateUserInput,
} from "../../domain/auth/ports/AuthRepository";

const prisma = new PrismaClient();

export class PrismaAuthRepository implements AuthRepository {
    async findByEmail(email: string): Promise<AuthUser | null> {
        const u = await prisma.user.findUnique({ where: { email } });
        if (!u) return null;

        const passwordHash = (u as any).password ?? (u as any).passwordHash;

        return { id: u.id, email: u.email, passwordHash };
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
            },
        });

        const passwordHash =
            (created as any).password ?? (created as any).passwordHash;

        return {
            id: created.id,
            email: created.email,
            passwordHash,
        };
    }
}
