export type DiscussionStatus = 'OPEN' | 'ASSIGNED' | 'CLOSED';

export interface Discussion {
    id: string;
    ownerId: string;
    assignedAdvisorId: string | null;
    status: DiscussionStatus;
    title?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
