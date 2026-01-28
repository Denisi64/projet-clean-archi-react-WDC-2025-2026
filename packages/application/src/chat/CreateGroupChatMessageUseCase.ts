import { Result, err, ok } from "../Result";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";
import { GroupChatRepository } from "@proj/domain/chat/ports/GroupChatRepository";

type Input = {
    actorRole: UserRole;
    actorId: string;
    content: string;
};

type Output = {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    senderRole: "ADVISOR" | "DIRECTOR";
};

type UseCaseError = ForbiddenRoleError | Error;

export class CreateGroupChatMessageUseCase {
    constructor(private readonly repo: GroupChatRepository) {}

    async execute(input: Input): Promise<Result<Output, UseCaseError>> {
        if (!this.canAccess(input.actorRole)) {
            return err(new ForbiddenRoleError());
        }

        const message = await this.repo.createMessage({
            senderId: input.actorId,
            content: input.content,
        });

        return ok({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            senderId: message.senderId,
            senderName: message.senderName,
            senderRole: message.senderRole,
        });
    }

    private canAccess(role: UserRole): boolean {
        return role === "ADVISOR" || role === "DIRECTOR";
    }
}
