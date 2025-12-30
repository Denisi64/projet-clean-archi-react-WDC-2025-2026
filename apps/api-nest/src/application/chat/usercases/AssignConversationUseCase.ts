import { ConversationRepository } from '../ports/ConversationRepository';
import { ChatEventsPort } from '../ports/ChatEventsPort';
import {
    AlreadyAssigned,
    ConversationNotFound,
} from '../../../domain/chat/errors';

interface Input {
    advisorId: string;
    conversationId: string;
}

export class AssignConversationUseCase {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input) {
        const conv = await this.conversations.findById(input.conversationId);
        if (!conv) throw new ConversationNotFound();

        if (conv.assignedAdvisorId) throw new AlreadyAssigned();

        conv.assignedAdvisorId = input.advisorId;
        conv.status = 'ASSIGNED';
        conv.updatedAt = new Date();

        await this.conversations.save(conv);

        await this.events.conversationAssigned({
            conversationId: conv.id,
            advisorId: input.advisorId,
        });

        return conv;
    }
}
