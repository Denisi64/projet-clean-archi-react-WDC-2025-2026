import { Conversation } from '../../../domain/chat/Conversation';

export interface ConversationRepository {
    findById(id: string): Promise<Conversation | null>;
    findUnassigned(): Promise<Conversation[]>;
    findByClient(clientId: string): Promise<Conversation[]>;
    findByAdvisor(advisorId: string): Promise<Conversation[]>;
    save(conversation: Conversation): Promise<void>;
}
