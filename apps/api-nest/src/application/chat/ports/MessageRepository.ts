import { Message } from '../../../domain/chat/Message';

export interface MessageRepository {
    findByConversation(conversationId: string): Promise<Message[]>;
    save(message: Message): Promise<void>;
}
