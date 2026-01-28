// apps/api-nest/src/application/chat/usecases/GetDiscussionUseCase.ts
import { DiscussionRepository } from '@domain/src/chat/ports/DiscussionRepository';
import {
    DiscussionNotFound,
    ForbiddenDiscussionAccess,
} from '@domain/src/chat/error/errors';
import { Discussion } from '@domain/src/chat/Discussion';

interface Input {
    discussionId: string;
    userId: string;
    role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR';
}

export class GetDiscussionUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
    ) {}

    async execute(input: Input): Promise<Discussion> {
        const discussion = await this.discussions.findById(
            input.discussionId,
        );

        if (!discussion) {
            throw new DiscussionNotFound();
        }

        if (input.role === 'CLIENT' && discussion.ownerId !== input.userId) {
            throw new ForbiddenDiscussionAccess();
        }

        if (
            input.role === 'ADVISOR' &&
            discussion.assignedAdvisorId !== input.userId
        ) {
            throw new ForbiddenDiscussionAccess();
        }

        return discussion;
    }
}
