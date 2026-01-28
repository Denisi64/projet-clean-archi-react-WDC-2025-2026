import { DiscussionRepository } from "@proj/domain/chat/ports/DiscussionRepository";
import { ChatEventsPort } from "@proj/domain/chat/ports/ChatEventsPort";
import { AssignDiscussionInput } from "./inputs/AssignDiscussionInput";

export class AssignDiscussionUseCase {
    constructor(
        private readonly discussions: DiscussionRepository,
        private readonly events: ChatEventsPort
    ) {}

    async execute(input: AssignDiscussionInput) {
        const discussion = await this.discussions.findById(input.discussionId);

        if (!discussion) {
            throw new Error("Discussion not found");
        }

        if (discussion.status === "CLOSED") {
            throw new Error("Discussion is closed");
        }

        discussion.assignedAdvisorId = input.advisorId;
        discussion.status = "ASSIGNED";

        await this.discussions.save(discussion);

        await this.events.discussionAssigned({
            discussionId: input.discussionId,
            advisorId: input.advisorId,
        });
    }
}
