import { DiscussionRepository } from '@proj/domain/chat/ports/DiscussionRepository';
import { MessageRepository } from '@proj/domain/chat/ports/MessageRepository';
import { ChatEventsPort } from '@proj/domain/chat/ports/ChatEventsPort';
import { Message } from "@proj/domain/chat/Message";
import {
    ForbiddenDiscussionAccess,
    DiscussionNotFound,
    DiscussionClosed,
} from '@proj/domain/chat/error/errors';

interface Input {
    ownerId: string;
    discussionId: string;
    content: string;
}

export class SendClientMessageUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly messages: MessageRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input): Promise<Message> {
        const conv = await this.discussions.findById(input.discussionId);
        if (!conv) throw new DiscussionNotFound();

        if (conv.ownerId !== input.ownerId) {
            throw new ForbiddenDiscussionAccess();
        }

        if (conv.status === 'CLOSED') throw new DiscussionClosed();

        const message: Message = {
            id: crypto.randomUUID(),
            discussionId: conv.id,
            authorId: input.ownerId,
            authorRole: 'CLIENT',
            content: input.content,
            createdAt: new Date(),
        };

        await this.messages.save(message);

        await this.events.newMessage({
            discussionId: conv.id,
            message,
        });

        return message;
    }
}
