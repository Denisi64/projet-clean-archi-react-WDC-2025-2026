import { DiscussionRepository } from '@proj/domain/chat/ports/DiscussionRepository';
import { ChatEventsPort } from '@proj/domain/chat/ports/ChatEventsPort';
import {
    DiscussionNotFound,
    ForbiddenDiscussionAccess,
} from '@proj/domain/chat/error/errors';

interface Input {
    fromAdvisorId: string;
    toAdvisorId: string;
    discussionId: string;
}

export class TransferDiscussionUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input) {
        const conv = await this.discussions.findById(input.discussionId);
        if (!conv) throw new DiscussionNotFound();

        if (conv.assignedAdvisorId !== input.fromAdvisorId) {
            throw new ForbiddenDiscussionAccess();
        }

        conv.assignedAdvisorId = input.toAdvisorId;
        conv.updatedAt = new Date();

        await this.discussions.save(conv);

        await this.events.discussionTransferred({
            discussionId: conv.id,
            fromAdvisorId: input.fromAdvisorId,
            toAdvisorId: input.toAdvisorId,
        });

        return conv;
    }
}
