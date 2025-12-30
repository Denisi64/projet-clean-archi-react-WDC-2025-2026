import { UserRole } from './UserRole';

export interface Message {
    id: string;
    conversationId: string;
    authorId: string;
    authorRole: UserRole;
    content: string;
    createdAt: Date;
}
