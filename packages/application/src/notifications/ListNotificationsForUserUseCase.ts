import { NotificationRepository } from "@proj/domain/notifications/ports/NotificationRepository";
import { Result, ok } from "../Result";

type Input = {
    userId: string;
    since?: Date;
    limit?: number;
};

type Output = {
    notifications: {
        id: string;
        title: string;
        body: string | null;
        createdAt: string;
    }[];
};

export class ListNotificationsForUserUseCase {
    constructor(private readonly repo: NotificationRepository) {}

    async execute(input: Input): Promise<Result<Output, Error>> {
        const rows = await this.repo.listForUser({
            userId: input.userId,
            since: input.since,
            limit: input.limit,
        });
        return ok({
            notifications: rows.map((row) => ({
                id: row.id,
                title: row.title,
                body: row.body ?? null,
                createdAt: row.createdAt.toISOString(),
            })),
        });
    }
}
