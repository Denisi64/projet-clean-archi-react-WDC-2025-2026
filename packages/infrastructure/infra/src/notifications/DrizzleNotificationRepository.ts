import {
    CreateNotificationInput,
    NotificationRepository,
    NotificationSnapshot,
} from "@proj/domain/notifications/ports/NotificationRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { notifications } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";
import { and, eq, gt } from "drizzle-orm";

export class DrizzleNotificationRepository implements NotificationRepository {
    async create(input: CreateNotificationInput): Promise<NotificationSnapshot> {
        const db = getDrizzleDb();
        const id = newId();
        await db.insert(notifications).values({
            id,
            userId: input.userId,
            title: input.title,
            body: input.body ?? null,
        });
        const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
        const row = rows[0];
        return {
            id: row.id,
            userId: row.userId,
            title: row.title,
            body: row.body ?? null,
            readAt: row.readAt ?? null,
            createdAt: row.createdAt,
        };
    }

    async listForUser(input: {
        userId: string;
        since?: Date;
        limit?: number;
    }): Promise<NotificationSnapshot[]> {
        const db = getDrizzleDb();
        const limit = input.limit ?? 50;
        const where = input.since
            ? and(eq(notifications.userId, input.userId), gt(notifications.createdAt, input.since))
            : eq(notifications.userId, input.userId);

        const rows = await db
            .select()
            .from(notifications)
            .where(where)
            .orderBy(notifications.createdAt)
            .limit(limit);

        return rows.map((row) => ({
            id: row.id,
            userId: row.userId,
            title: row.title,
            body: row.body ?? null,
            readAt: row.readAt ?? null,
            createdAt: row.createdAt,
        }));
    }
}
