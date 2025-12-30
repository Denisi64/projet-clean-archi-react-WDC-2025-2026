import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/PrismaService';
import { ConversationRepository } from '../../../application/chat/ports/ConversationRepository';
import { Conversation } from '../../../domain/chat/Conversation';
import { PrismaConversationMapper } from '../mappers/PrismaConversationMapper';

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<Conversation | null> {
        const raw = await this.prisma.conversation.findUnique({
            where: { id },
        });
        return raw ? PrismaConversationMapper.toDomain(raw) : null;
    }

    async findUnassigned(): Promise<Conversation[]> {
        const raws = await this.prisma.conversation.findMany({
            where: {
                assignedAdvisorId: null,
                status: 'OPEN',
            },
        });

        return raws.map(raw => PrismaConversationMapper.toDomain(raw));

    }

    async findByClient(clientId: string): Promise<Conversation[]> {
        const raws = await this.prisma.conversation.findMany({
            where: {
                ownerId: clientId, // ✅ Prisma field
            },
        });

        return raws.map(raw => PrismaConversationMapper.toDomain(raw));

    }

    async findByAdvisor(advisorId: string): Promise<Conversation[]> {
        const raws = await this.prisma.conversation.findMany({
            where: {
                assignedAdvisorId: advisorId,
            },
        });

        return raws.map(raw => PrismaConversationMapper.toDomain(raw));

    }

    async save(conv: Conversation): Promise<void> {
        await this.prisma.conversation.upsert({
            where: { id: conv.id },
            update: {
                assignedAdvisorId: conv.assignedAdvisorId,
                status: conv.status,
                title: conv.title ?? null,
                updatedAt: conv.updatedAt,
            },
            create: {
                id: conv.id,
                ownerId: conv.clientId,
                assignedAdvisorId: conv.assignedAdvisorId,
                status: conv.status,
                title: conv.title ?? null,
            },
        });
    }
}
