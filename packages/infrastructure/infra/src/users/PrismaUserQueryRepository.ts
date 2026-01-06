import { Prisma, PrismaClient } from "@prisma/client";
import {
    UserMinimal,
    UserQueryRepository,
    UserRole,
    UserAccess,
    UserProfile,
} from "@proj/domain/users/ports/UserQueryRepository";

export class PrismaUserQueryRepository implements UserQueryRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async search(query: string): Promise<UserMinimal[]> {
        const q = query.trim();
        const where =
            q.length >= 2
                ? {
                      OR: [
                          { email: { contains: q } },
                          { name: { contains: q } },
                      ],
                  }
                : {};

        const users = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { id: true, email: true, name: true },
        });

        return users.map((u) => ({ id: u.id, email: u.email, name: u.name }));
    }

    async getRoleById(userId: string): Promise<UserRole | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return user?.role ?? null;
    }

    async getAccessById(userId: string): Promise<UserAccess | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, bannedAt: true },
        });

        if (!user?.role) return null;
        return { role: user.role, bannedAt: user.bannedAt ?? null };
    }

    async getProfileById(userId: string): Promise<UserProfile | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, bannedAt: true },
        });

        if (!user?.role) return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            bannedAt: user.bannedAt ?? null,
        };
    }
}
