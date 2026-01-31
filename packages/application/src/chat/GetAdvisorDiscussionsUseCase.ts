import { Discussion } from "@proj/domain/chat/Discussion";
import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";

interface Input {
    advisorId: string;
}

export class GetAdvisorDiscussionsUseCase {
    constructor(private readonly discussions: DiscussionRepository) {}

    async execute(input: Input): Promise<Discussion[]> {
        return this.discussions.findByAdvisor(input.advisorId);
    }
}
