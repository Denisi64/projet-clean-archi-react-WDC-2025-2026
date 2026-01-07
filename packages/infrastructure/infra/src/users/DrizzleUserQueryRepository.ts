import { and, desc, eq, like, or } from "drizzle-orm";
import {
    UserMinimal,
    UserQueryRepository,
    UserRole,
    UserAccess,
    UserProfile,
} from "@proj/domain/users/ports/UserQueryRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { users } from "../db/drizzle/schema";

export class DrizzleUserQueryRepository implements UserQueryRepository {
    async search(query: string): Promise<UserMinimal[]> {
        const db = getDrizzleDb();
        const q = query.trim();

        if (q.length < 2) {
            const rows = await db
                .select({ id: users.id, email: users.email, name: users.name })
                .from(users)
                .orderBy(desc(users.createdAt))
                .limit(20);
            return rows;
        }

        const pattern = `%${q}%`;
        const rows = await db
            .select({ id: users.id, email: users.email, name: users.name })
            .from(users)
            .where(or(like(users.email, pattern), like(users.name, pattern)))
            .orderBy(desc(users.createdAt))
            .limit(20);

        return rows;
    }

    async getRoleById(userId: string): Promise<UserRole | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        return rows[0]?.role ?? null;
    }

    async getAccessById(userId: string): Promise<UserAccess | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select({ role: users.role, bannedAt: users.bannedAt })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        const row = rows[0];
        if (!row?.role) return null;
        return { role: row.role, bannedAt: row.bannedAt ?? null };
    }

    async getProfileById(userId: string): Promise<UserProfile | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                bannedAt: users.bannedAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        const row = rows[0];
        if (!row?.role) return null;
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            bannedAt: row.bannedAt ?? null,
        };
    }
}
