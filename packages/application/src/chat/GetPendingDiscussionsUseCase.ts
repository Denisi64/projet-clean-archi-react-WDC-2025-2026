import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";

export class GetPendingDiscussionsUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
    ) {}

    execute() {
        return this.discussions.findPending();
    }
}
