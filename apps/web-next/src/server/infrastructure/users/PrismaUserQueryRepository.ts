import { PrismaClient } from "@prisma/client";
import { UserQueryRepository, UserMinimal, UserRole } from "../../domain/users/ports/UserQueryRepository";

export class PrismaUserQueryRepository implements UserQueryRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async search(query: string): Promise<UserMinimal[]> {
        const q = query.trim();
        const where =
            q.length >= 2
                ? {
                      OR: [
                          { email: { contains: q, mode: "insensitive" } },
                          { name: { contains: q, mode: "insensitive" } },
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
}
