import { eq } from "drizzle-orm";
import { BannedUser, UserAdminRepository } from "@proj/domain/users/ports/UserAdminRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { users } from "../db/drizzle/schema";

export class DrizzleUserAdminRepository implements UserAdminRepository {
    async banUser(userId: string): Promise<BannedUser> {
        const db = getDrizzleDb();
        const bannedAt = new Date();
        await db.update(users).set({ bannedAt }).where(eq(users.id, userId));
        return { id: userId, bannedAt };
    }
}
