export type ConversationStatus = 'OPEN' | 'ASSIGNED' | 'CLOSED';

export interface Conversation {
    id: string;
    clientId: string;
    assignedAdvisorId: string | null;
    status: ConversationStatus;
    title?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
