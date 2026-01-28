import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import { Discussion } from "@domain/src/chat/Discussion";

interface Input {
    ownerId: string;
}

export class GetClientDiscussionsUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
    ) {}

    async execute(input: Input): Promise<Discussion[]> {
        return this.discussions.findByClient(input.ownerId);
    }
}
