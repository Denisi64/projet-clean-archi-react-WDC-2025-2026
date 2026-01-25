import { PrismaClient } from "@prisma/client";
import { CreateNewsInput, NewsRepository, NewsSnapshot } from "@proj/domain/news/ports/NewsRepository";

export class PrismaNewsRepository implements NewsRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async create(input: CreateNewsInput): Promise<NewsSnapshot> {
        const news = await this.prisma.news.create({
            data: {
                title: input.title,
                body: input.body ?? null,
                createdById: input.createdById,
            },
            select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                createdById: true,
            },
        });

        return {
            id: news.id,
            title: news.title,
            body: news.body ?? null,
            createdAt: news.createdAt,
            createdById: news.createdById,
        };
    }

    async list(input?: { since?: Date; limit?: number }): Promise<NewsSnapshot[]> {
        const rows = await this.prisma.news.findMany({
            where: input?.since ? { createdAt: { gt: input.since } } : undefined,
            orderBy: { createdAt: "desc" },
            take: input?.limit ?? 50,
            select: {
                id: true,
                title: true,
                body: true,
                createdAt: true,
                createdById: true,
            },
        });

        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body ?? null,
            createdAt: row.createdAt,
            createdById: row.createdById,
        }));
    }
}
