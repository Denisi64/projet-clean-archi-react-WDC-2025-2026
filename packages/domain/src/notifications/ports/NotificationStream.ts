export type NotificationEvent = {
    id: string;
    title: string;
    body: string | null;
    createdAt: string;
};

export type NotificationListener = (event: NotificationEvent) => void;

export interface NotificationStream {
    publishToUser(userId: string, event: NotificationEvent): Promise<void> | void;
    subscribe(userId: string, listener: NotificationListener): () => void;
}
