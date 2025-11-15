import { PrismaClient } from "@prisma/client";
import { AuthRepository } from "../domain/auth/ports/AuthRepository";

const prisma = new PrismaClient();

export class PrismaAuthRepository implements AuthRepository {
    async findByEmail(email: string) {
        const u = await prisma.user.findUnique({ where: { email } });
        if (!u) return null;
        const passwordHash = (u as any).password ?? (u as any).passwordHash;
        return { id: u.id, email: u.email, passwordHash };
    }
}
