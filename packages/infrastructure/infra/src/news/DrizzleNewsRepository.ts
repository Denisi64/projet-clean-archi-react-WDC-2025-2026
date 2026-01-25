import { CreateNewsInput, NewsRepository, NewsSnapshot } from "@proj/domain/news/ports/NewsRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { news } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";
import { desc, eq, gt } from "drizzle-orm";

export class DrizzleNewsRepository implements NewsRepository {
    async create(input: CreateNewsInput): Promise<NewsSnapshot> {
        const db = getDrizzleDb();
        const id = newId();
        await db.insert(news).values({
            id,
            title: input.title,
            body: input.body ?? null,
            createdById: input.createdById,
        });
        const rows = await db.select().from(news).where(eq(news.id, id)).limit(1);
        const row = rows[0];
        return {
            id: row.id,
            title: row.title,
            body: row.body ?? null,
            createdAt: row.createdAt,
            createdById: row.createdById,
        };
    }

    async list(input?: { since?: Date; limit?: number }): Promise<NewsSnapshot[]> {
        const db = getDrizzleDb();
        const limit = input?.limit ?? 50;
        const rows = input?.since
            ? await db
                  .select()
                  .from(news)
                  .where(gt(news.createdAt, input.since))
                  .orderBy(desc(news.createdAt))
                  .limit(limit)
            : await db.select().from(news).orderBy(desc(news.createdAt)).limit(limit);

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body ?? null,
            createdAt: row.createdAt,
            createdById: row.createdById,
        }));
    }
}
