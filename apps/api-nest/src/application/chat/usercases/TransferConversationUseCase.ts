import { ConversationRepository } from '../ports/ConversationRepository';
import { ChatEventsPort } from '../ports/ChatEventsPort';
import {
    ConversationNotFound,
    ForbiddenConversationAccess,
} from '../../../domain/chat/errors';

interface Input {
    fromAdvisorId: string;
    toAdvisorId: string;
    conversationId: string;
}

export class TransferConversationUseCase {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly events: ChatEventsPort,
    ) {}

    async execute(input: Input) {
        const conv = await this.conversations.findById(input.conversationId);
        if (!conv) throw new ConversationNotFound();

        if (conv.assignedAdvisorId !== input.fromAdvisorId) {
            throw new ForbiddenConversationAccess();
        }

        conv.assignedAdvisorId = input.toAdvisorId;
        conv.updatedAt = new Date();

        await this.conversations.save(conv);

        await this.events.conversationTransferred({
            conversationId: conv.id,
            fromAdvisorId: input.fromAdvisorId,
            toAdvisorId: input.toAdvisorId,
        });

        return conv;
    }
}
