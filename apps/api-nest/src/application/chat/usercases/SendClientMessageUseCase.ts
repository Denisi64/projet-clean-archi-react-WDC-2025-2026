import { ConversationRepository } from '../ports/ConversationRepository';
import { MessageRepository } from '../ports/MessageRepository';
import { ChatEventsPort } from '../ports/ChatEventsPort';
import { Message } from '../../../domain/chat/Message';
import {
    ForbiddenConversationAccess,
    ConversationNotFound,
    ConversationClosed,
} from '../../../domain/chat/errors';

interface Input {
    clientId: string;
    conversationId: string;
    content: string;
}

export class SendClientMessageUseCase {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly messages: MessageRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input): Promise<Message> {
        const conv = await this.conversations.findById(input.conversationId);
        if (!conv) throw new ConversationNotFound();

        if (conv.clientId !== input.clientId) {
            throw new ForbiddenConversationAccess();
        }

        if (conv.status === 'CLOSED') throw new ConversationClosed();

        const message: Message = {
            id: crypto.randomUUID(),
            conversationId: conv.id,
            authorId: input.clientId,
            authorRole: 'CLIENT',
            content: input.content,
            createdAt: new Date(),
        };

        await this.messages.save(message);

        await this.events.newMessage({
            conversationId: conv.id,
            message,
        });

        return message;
    }
}
