import { and, desc, eq, isNull } from "drizzle-orm";
import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import { Discussion } from "@proj/domain/chat/Discussion";
import { getDrizzleDb } from "../db/drizzle/client";
import { discussions } from "../db/drizzle/schema";

export class DrizzleDiscussionRepository implements DiscussionRepository {
    async findById(id: string): Promise<Discussion | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(discussions).where(eq(discussions.id, id)).limit(1);
        return rows[0] ? this.toDomain(rows[0]) : null;
    }

    async findPending(): Promise<Discussion[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(discussions)
            .where(and(eq(discussions.status, "OPEN"), isNull(discussions.assignedAdvisorId)))
            .orderBy(desc(discussions.updatedAt));
        return rows.map((row) => this.toDomain(row));
    }

    async findByClient(ownerId: string): Promise<Discussion[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(discussions)
            .where(eq(discussions.ownerId, ownerId))
            .orderBy(desc(discussions.updatedAt));
        return rows.map((row) => this.toDomain(row));
    }

    async findByAdvisor(advisorId: string): Promise<Discussion[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(discussions)
            .where(eq(discussions.assignedAdvisorId, advisorId))
            .orderBy(desc(discussions.updatedAt));
        return rows.map((row) => this.toDomain(row));
    }

    async save(discussion: Discussion): Promise<void> {
        const db = getDrizzleDb();
        const now = discussion.updatedAt ?? new Date();
        await db
            .insert(discussions)
            .values({
                id: discussion.id,
                ownerId: discussion.ownerId,
                assignedAdvisorId: discussion.assignedAdvisorId,
                status: discussion.status,
                title: discussion.title ?? null,
                createdAt: discussion.createdAt,
                updatedAt: now,
            })
            .onDuplicateKeyUpdate({
                set: {
                    assignedAdvisorId: discussion.assignedAdvisorId,
                    status: discussion.status,
                    title: discussion.title ?? null,
                    updatedAt: now,
                },
            });
    }

    private toDomain(row: typeof discussions.$inferSelect): Discussion {
        return {
            id: row.id,
            ownerId: row.ownerId,
            assignedAdvisorId: row.assignedAdvisorId ?? null,
            status: (row.status as Discussion["status"]) ?? "OPEN",
            title: row.title ?? null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
