export type NewsSnapshot = {
    id: string;
    title: string;
    body: string | null;
    createdAt: Date;
    createdById: string;
};

export type CreateNewsInput = {
    title: string;
    body?: string | null;
    createdById: string;
};

export interface NewsRepository {
    create(input: CreateNewsInput): Promise<NewsSnapshot>;
    list(input?: { since?: Date; limit?: number }): Promise<NewsSnapshot[]>;
}
