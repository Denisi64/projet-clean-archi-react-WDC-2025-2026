import { Message } from '../../../domain/chat/Message';

export interface ChatEventsPort {
    newMessage(payload: {
        conversationId: string;
        message: Message;
    }): Promise<void>;

    conversationAssigned(payload: {
        conversationId: string;
        advisorId: string;
    }): Promise<void>;

    conversationTransferred(payload: {
        conversationId: string;
        fromAdvisorId: string;
        toAdvisorId: string;
    }): Promise<void>;
}
