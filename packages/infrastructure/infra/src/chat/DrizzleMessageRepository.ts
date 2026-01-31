import { asc, eq } from "drizzle-orm";
import { MessageRepository } from "@proj/domain/chat/ports/MessageRepository";
import { Message } from "@proj/domain/chat/Message";
import { getDrizzleDb } from "../db/drizzle/client";
import { messages } from "../db/drizzle/schema";

export class DrizzleMessageRepository implements MessageRepository {
    async findByDiscussion(discussionId: string): Promise<Message[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(messages)
            .where(eq(messages.discussionId, discussionId))
            .orderBy(asc(messages.createdAt));
        return rows.map((row) => ({
            id: row.id,
            discussionId: row.discussionId,
            authorId: row.senderId,
            authorRole: row.authorRole as Message["authorRole"],
            content: row.content,
            createdAt: row.createdAt,
        }));
    }

    async save(message: Message): Promise<void> {
        const db = getDrizzleDb();
        await db.insert(messages).values({
            id: message.id,
            discussionId: message.discussionId,
            senderId: message.authorId,
            authorRole: message.authorRole,
            content: message.content,
            createdAt: message.createdAt,
        });
    }
}
