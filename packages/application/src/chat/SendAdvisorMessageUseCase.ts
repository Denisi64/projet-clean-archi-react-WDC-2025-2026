import { DiscussionRepository } from '@domain/src/chat/ports/DiscussionRepository';
import { MessageRepository } from '@domain/src/chat/ports/MessageRepository';
import { ChatEventsPort } from '@domain/src/chat/ports/ChatEventsPort';
import { Message } from '@domain/src/chat/Message';
import {
    DiscussionClosed,
    DiscussionNotFound,
    ForbiddenDiscussionAccess,
} from '@domain/src/chat/error/errors';

interface Input {
    advisorId: string;
    discussionId: string;
    content: string;
}

export class SendAdvisorMessageUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly messages: MessageRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input): Promise<Message> {
        const conv = await this.discussions.findById(input.discussionId);
        if (!conv) throw new DiscussionNotFound();

        if (conv.assignedAdvisorId !== input.advisorId) {
            throw new ForbiddenDiscussionAccess();
        }

        if (conv.status === 'CLOSED') throw new DiscussionClosed();

        if (conv.assignedAdvisorId === null) {
            const updatedDiscussion = {
                ...conv,
                assignedAdvisorId: input.advisorId,
                status: 'ASSIGNED' as const,
                updatedAt: new Date(),
            };

            await this.discussions.save(updatedDiscussion);

            await this.events.discussionAssigned({
                discussionId: updatedDiscussion.id,
                advisorId: input.advisorId,
            });

            conv.assignedAdvisorId = input.advisorId;
            conv.status = 'ASSIGNED';
        }

        if (conv.assignedAdvisorId !== input.advisorId) {
            throw new ForbiddenDiscussionAccess();
        }

        const message: Message = {
            id: crypto.randomUUID(),
            discussionId: conv.id,
            authorId: input.advisorId,
            authorRole: 'ADVISOR',
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
