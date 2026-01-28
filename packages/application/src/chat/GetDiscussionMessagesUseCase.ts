import { Message } from "@domain/src/chat/Message";
import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import {
    DiscussionNotFound,
    ForbiddenDiscussionAccess,
} from '@domain/src/chat/error/errors';
import { MessageRepository } from '@domain/src/chat/ports/MessageRepository';

interface Input {
    userId: string;
    role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR';
    discussionId: string;
}

export class GetDiscussionMessagesUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly messages: MessageRepository,
    ) {}

    async execute(input: Input): Promise<Message[]> {
        const discussion = await this.discussions.findById(
            input.discussionId,
        );

        if (!discussion) {
            throw new DiscussionNotFound();
        }

        if (input.role === 'CLIENT') {
            if (discussion.ownerId !== input.userId) {
                throw new ForbiddenDiscussionAccess();
            }
        }

        if (input.role === 'ADVISOR') {
            if (discussion.assignedAdvisorId !== input.userId) {
                throw new ForbiddenDiscussionAccess();
            }
        }

        return this.messages.findByDiscussion(discussion.id);
    }
}
