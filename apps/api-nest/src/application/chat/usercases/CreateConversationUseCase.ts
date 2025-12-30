import { ConversationRepository } from '../ports/ConversationRepository';
import { Conversation } from '../../../domain/chat/Conversation';

interface Input {
    clientId: string;
}

export class CreateConversationUseCase {
    constructor(private readonly conversations: ConversationRepository) {}

    async execute(input: Input): Promise<Conversation> {
        const conv: Conversation = {
            id: crypto.randomUUID(),
            clientId: input.clientId,
            assignedAdvisorId: null,
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.conversations.save(conv);
        return conv;
    }
}
