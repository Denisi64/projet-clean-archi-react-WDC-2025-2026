import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/PrismaService';
import { MessageRepository } from '../../../application/chat/ports/MessageRepository';
import { Message } from '../../../domain/chat/Message';
import { Message as PrismaMessage } from '@prisma/client';

@Injectable()
export class PrismaMessageRepository implements MessageRepository {
    constructor(private prisma: PrismaService) {}

    private toDomain(prismaMessage: PrismaMessage): Message {
        return {
            id: prismaMessage.id,
            conversationId: prismaMessage.conversationId,
            authorId: prismaMessage.senderId,
            authorRole: prismaMessage.authorRole,
            content: prismaMessage.content,
            createdAt: prismaMessage.createdAt,
        };
    }

    async findByConversation(conversationId: string): Promise<Message[]> {
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });

        return messages.map(this.toDomain);
    }

    async save(message: Message): Promise<void> {
        await this.prisma.message.create({
            data: {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.authorId,
                authorRole: message.authorRole,
                content: message.content,
                createdAt: message.createdAt,
            },
        });
    }
}
