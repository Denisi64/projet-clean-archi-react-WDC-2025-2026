import { and, desc, eq, inArray } from "drizzle-orm";
import { GroupChatMessage, GroupChatRepository } from "@proj/domain/chat/ports/GroupChatRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { discussions, messages, users } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

const GROUP_TITLE = "ADVISOR_DIRECTOR_GROUP";

export class DrizzleGroupChatRepository implements GroupChatRepository {
    async listMessages(input?: { limit?: number }): Promise<GroupChatMessage[]> {
        const db = getDrizzleDb();
        const discussion = await this.findOrCreateDiscussion();
        const rows = await db
            .select({
                id: messages.id,
                content: messages.content,
                createdAt: messages.createdAt,
                senderId: messages.senderId,
                senderName: users.name,
                senderEmail: users.email,
                senderRole: users.role,
            })
            .from(messages)
            .innerJoin(users, eq(users.id, messages.senderId))
            .where(eq(messages.discussionId, discussion.id))
            .orderBy(desc(messages.createdAt))
            .limit(input?.limit ?? 50);

        return rows.map((row) => ({
            id: row.id,
            content: row.content,
            createdAt: row.createdAt,
            senderId: row.senderId,
            senderName: row.senderName ?? row.senderEmail ?? "User",
            senderRole: row.senderRole === "DIRECTOR" ? "DIRECTOR" : "ADVISOR",
        }));
    }

    async createMessage(input: { senderId: string; content: string }): Promise<GroupChatMessage> {
        const db = getDrizzleDb();
        const discussion = await this.findOrCreateDiscussion(input.senderId);
        const id = newId();
        await db.insert(messages).values({
            id,
            discussionId: discussion.id,
            senderId: input.senderId,
            content: input.content,
        });
        const rows = await db
            .select({
                id: messages.id,
                content: messages.content,
                createdAt: messages.createdAt,
                senderId: messages.senderId,
                senderName: users.name,
                senderEmail: users.email,
                senderRole: users.role,
            })
            .from(messages)
            .innerJoin(users, eq(users.id, messages.senderId))
            .where(eq(messages.id, id))
            .limit(1);
        const row = rows[0];
        return {
            id: row.id,
            content: row.content,
            createdAt: row.createdAt,
            senderId: row.senderId,
            senderName: row.senderName ?? row.senderEmail ?? "User",
            senderRole: row.senderRole === "DIRECTOR" ? "DIRECTOR" : "ADVISOR",
        };
    }

    private async findOrCreateDiscussion(ownerId?: string) {
        const db = getDrizzleDb();
        const rows = await db
            .select({ id: discussions.id, ownerId: discussions.ownerId })
            .from(discussions)
            .where(eq(discussions.title, GROUP_TITLE))
            .limit(1);
        if (rows[0]) return rows[0];

        let owner = ownerId;
        if (!owner) {
            const anyUser = await db.select({ id: users.id }).from(users).limit(1);
            owner = anyUser[0]?.id;
        }
        if (!owner) {
            throw new Error("GROUP_OWNER_NOT_FOUND");
        }

        const id = newId();
        await db.insert(discussions).values({
            id,
            ownerId: owner,
            title: GROUP_TITLE,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return { id, ownerId: owner };
    }
}
