import { Message } from "../Message";

export interface ChatEventsPort {
    newMessage(payload: {
        discussionId: string;
        message: Message;
    }): Promise<void>;

    discussionAssigned(payload: {
        discussionId: string;
        advisorId: string;
    }): Promise<void>;

    discussionTransferred(payload: {
        discussionId: string;
        fromAdvisorId: string;
        toAdvisorId: string;
    }): Promise<void>;

    discussionClosed(payload: {
        discussionId: string;
        advisorId: string;
    }): Promise<void>;
}
