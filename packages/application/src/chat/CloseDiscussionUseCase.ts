import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import { ChatEventsPort } from "@proj/domain/chat/ports/ChatEventsPort";
import { CloseDiscussionInput } from "./inputs/CloseDiscussionInput";

export class CloseDiscussionUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly events: ChatEventsPort
    ) {}

    async execute(input: CloseDiscussionInput) {
        const discussion = await this.discussions.findById(input.discussionId);

        if (!discussion) {
            throw new Error("Discussion not found");
        }

        if (!discussion.assignedAdvisorId) {
            throw new Error("Discussion is not assigned");
        }

        discussion.status = "CLOSED";

        await this.discussions.save(discussion);

        await this.events.discussionClosed({
            discussionId: input.discussionId,
            advisorId: discussion.assignedAdvisorId,
        });
    }
}
