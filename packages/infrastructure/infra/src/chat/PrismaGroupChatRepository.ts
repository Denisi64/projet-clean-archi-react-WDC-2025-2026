import { PrismaClient } from "@prisma/client";
import { GroupChatMessage, GroupChatRepository } from "@proj/domain/chat/ports/GroupChatRepository";

const GROUP_TITLE = "ADVISOR_DIRECTOR_GROUP";

export class PrismaGroupChatRepository implements GroupChatRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async listMessages(input?: { limit?: number }): Promise<GroupChatMessage[]> {
        const discussion = await this.findOrCreateDiscussion();
        const rows = await this.prisma.message.findMany({
            where: { discussionId: discussion.id },
            orderBy: { createdAt: "desc" },
            take: input?.limit ?? 50,
            include: {
                sender: { select: { id: true, name: true, role: true, email: true } },
            },
        });

        return rows.map((row) => ({
            id: row.id,
            content: row.content,
            createdAt: row.createdAt,
            senderId: row.senderId,
            senderName: row.sender?.name ?? row.sender?.email ?? "User",
            senderRole: row.sender?.role === "DIRECTOR" ? "DIRECTOR" : "ADVISOR",
        }));
    }

    async createMessage(input: { senderId: string; content: string }): Promise<GroupChatMessage> {
        const discussion = await this.findOrCreateDiscussion(input.senderId);
        const message = await this.prisma.message.create({
            data: {
                discussionId: discussion.id,
                senderId: input.senderId,
                content: input.content,
            },
            include: {
                sender: { select: { id: true, name: true, role: true, email: true } },
            },
        });

        return {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
            senderName: message.sender?.name ?? message.sender?.email ?? "User",
            senderRole: message.sender?.role === "DIRECTOR" ? "DIRECTOR" : "ADVISOR",
        };
    }

    private async findOrCreateDiscussion(ownerId?: string) {
        const existing = await this.prisma.discussion.findFirst({
            where: { title: GROUP_TITLE },
            orderBy: { createdAt: "asc" },
        });
        if (existing) return existing;
        const fallbackOwner = ownerId ?? (await this.prisma.user.findFirst({ select: { id: true } }))?.id;
        if (!fallbackOwner) {
            throw new Error("GROUP_OWNER_NOT_FOUND");
        }
        return this.prisma.discussion.create({
            data: {
                title: GROUP_TITLE,
                ownerId: fallbackOwner,
            },
        });
    }
}
