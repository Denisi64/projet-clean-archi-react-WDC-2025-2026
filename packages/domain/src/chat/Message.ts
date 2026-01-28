export type MessageAuthorRole = 'CLIENT' | 'ADVISOR';

export interface Message {
    id: string;
    discussionId: string;
    authorId: string;
    authorRole: MessageAuthorRole;
    content: string;
    createdAt: Date;
}
