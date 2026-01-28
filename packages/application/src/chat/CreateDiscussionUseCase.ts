import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import { ChatEventsPort } from "@proj/domain/chat/ports/ChatEventsPort";
import { Discussion } from "@domain/src/chat/Discussion";

interface Input {
    ownerId: string;
}

export class CreateDiscussionUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
    ) {}

    async execute(input: Input): Promise<Discussion> {
        const conv: Discussion = {
            id: crypto.randomUUID(),
            ownerId: input.ownerId,
            assignedAdvisorId: null,
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.discussions.save(conv);
        return conv;
    }
}
