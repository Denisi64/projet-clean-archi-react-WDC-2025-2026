import { PrismaClient } from "@prisma/client";
import { BannedUser, UserAdminRepository } from "../../domain/users/ports/UserAdminRepository";

export class PrismaUserAdminRepository implements UserAdminRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async banUser(userId: string): Promise<BannedUser> {
        const bannedAt = new Date();
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { bannedAt },
            select: { id: true, bannedAt: true },
        });

        return { id: user.id, bannedAt: user.bannedAt ?? bannedAt };
    }
}
