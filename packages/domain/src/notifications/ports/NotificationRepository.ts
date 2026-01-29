export type NotificationSnapshot = {
    id: string;
    userId: string;
    title: string;
    body: string | null;
    readAt: Date | null;
    createdAt: Date;
};

export type CreateNotificationInput = {
    userId: string;
    title: string;
    body?: string | null;
};

export interface NotificationRepository {
    create(input: CreateNotificationInput): Promise<NotificationSnapshot>;
    listForUser(input: {
        userId: string;
        since?: Date;
        limit?: number;
    }): Promise<NotificationSnapshot[]>;
}
