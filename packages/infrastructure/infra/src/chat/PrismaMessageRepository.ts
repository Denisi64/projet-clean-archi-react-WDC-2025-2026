import { PrismaClient, Message as PrismaMessage } from "@prisma/client";
import { MessageRepository } from "@proj/domain/chat/ports/MessageRepository";
import { Message } from "@proj/domain/chat/Message";

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

  private toDomain(prismaMessage: PrismaMessage): Message {
    return {
      id: prismaMessage.id,
      discussionId: prismaMessage.discussionId,
      authorId: prismaMessage.senderId,
      authorRole: prismaMessage.authorRole,
      content: prismaMessage.content,
      createdAt: prismaMessage.createdAt,
    };
  }

  async findByDiscussion(discussionId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { discussionId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((m) => this.toDomain(m));
  }

  async save(message: Message): Promise<void> {
    await this.prisma.message.create({
      data: {
        id: message.id,
        discussionId: message.discussionId,
        senderId: message.authorId,
        authorRole: message.authorRole,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  }
}
