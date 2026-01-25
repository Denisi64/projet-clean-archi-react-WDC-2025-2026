import { PrismaClient } from "@prisma/client";
import {
    CreateNotificationInput,
    NotificationRepository,
    NotificationSnapshot,
} from "@proj/domain/notifications/ports/NotificationRepository";

export class PrismaNotificationRepository implements NotificationRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async create(input: CreateNotificationInput): Promise<NotificationSnapshot> {
        const notification = await this.prisma.notification.create({
            data: {
                userId: input.userId,
                title: input.title,
                body: input.body ?? null,
            },
            select: {
                id: true,
                userId: true,
                title: true,
                body: true,
                readAt: true,
                createdAt: true,
            },
        });

        return {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
            body: notification.body ?? null,
            readAt: notification.readAt ?? null,
            createdAt: notification.createdAt,
        };
    }

    async listForUser(input: {
        userId: string;
        since?: Date;
        limit?: number;
    }): Promise<NotificationSnapshot[]> {
        const rows = await this.prisma.notification.findMany({
            where: {
                userId: input.userId,
                ...(input.since ? { createdAt: { gt: input.since } } : {}),
            },
            orderBy: { createdAt: "asc" },
            take: input.limit ?? 50,
            select: {
                id: true,
                userId: true,
                title: true,
                body: true,
                readAt: true,
                createdAt: true,
            },
        });

        return rows.map((row) => ({
            id: row.id,
            userId: row.userId,
            title: row.title,
            body: row.body ?? null,
            readAt: row.readAt ?? null,
            createdAt: row.createdAt,
        }));
    }
}
