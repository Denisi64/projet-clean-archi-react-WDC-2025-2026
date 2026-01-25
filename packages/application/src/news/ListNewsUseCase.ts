import { NewsRepository } from "@proj/domain/news/ports/NewsRepository";
import { Result, ok } from "../Result";

type Input = {
    since?: Date;
    limit?: number;
};

type Output = {
    news: {
        id: string;
        title: string;
        body: string | null;
        createdAt: string;
        createdById: string;
    }[];
};

export class ListNewsUseCase {
    constructor(private readonly repo: NewsRepository) {}

    async execute(input: Input): Promise<Result<Output, Error>> {
        const rows = await this.repo.list({ since: input.since, limit: input.limit });
        return ok({
            news: rows.map((item) => ({
                id: item.id,
                title: item.title,
                body: item.body ?? null,
                createdAt: item.createdAt.toISOString(),
                createdById: item.createdById,
            })),
        });
    }
}
