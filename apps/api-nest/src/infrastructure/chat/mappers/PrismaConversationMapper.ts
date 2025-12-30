import { Conversation } from '../../../domain/chat/Conversation';
import { Conversation as PrismaConversation } from '@prisma/client';

export class PrismaConversationMapper {
    static toDomain(raw: PrismaConversation): Conversation {
        return {
            id: raw.id,
            clientId: raw.ownerId,
            assignedAdvisorId: raw.assignedAdvisorId,
            status: raw.status,
            title: raw.title,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        };
    }
}
