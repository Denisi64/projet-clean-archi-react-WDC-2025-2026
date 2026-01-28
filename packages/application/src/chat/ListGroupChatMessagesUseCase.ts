import { Result, ok } from "../Result";
import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";
import { GroupChatMessage, GroupChatRepository } from "@proj/domain/chat/ports/GroupChatRepository";

type Input = {
    actorRole: UserRole;
    limit?: number;
};

type Output = {
    messages: {
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string;
        senderRole: "ADVISOR" | "DIRECTOR";
    }[];
};

export class ListGroupChatMessagesUseCase {
    constructor(private readonly repo: GroupChatRepository) {}

    async execute(input: Input): Promise<Result<Output, Error>> {
        if (!this.canAccess(input.actorRole)) {
            return ok({ messages: [] });
        }

        const rows = await this.repo.listMessages({ limit: input.limit });
        return ok({ messages: rows.map(this.toDto) });
    }

    private canAccess(role: UserRole): boolean {
        return role === "ADVISOR" || role === "DIRECTOR";
    }

    private toDto(row: GroupChatMessage) {
        return {
            id: row.id,
            content: row.content,
            createdAt: row.createdAt.toISOString(),
            senderId: row.senderId,
            senderName: row.senderName,
            senderRole: row.senderRole,
        };
    }
}
