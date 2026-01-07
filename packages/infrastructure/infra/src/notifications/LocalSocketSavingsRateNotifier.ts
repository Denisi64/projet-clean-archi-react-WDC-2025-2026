import { SavingsRateNotifier } from "@proj/application/accounts/ports/SavingsRateNotifier";
import { resolveDbDriver } from "../db/driver";
import { getDrizzleDb } from "../db/drizzle/client";
import { accounts, notifications } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";
import { PrismaClient } from "@prisma/client";
import { and, eq } from "drizzle-orm";

export class LocalSocketSavingsRateNotifier implements SavingsRateNotifier {
    private prisma: PrismaClient | null;

    constructor(prisma?: PrismaClient | null) {
        this.prisma = prisma ?? null;
    }

    async notifyRateChanged(rate: number): Promise<void> {
        const dbDriver = resolveDbDriver();
        const userIds =
            dbDriver === "mariadb"
                ? await this.loadSavingsUsersFromDrizzle()
                : await this.loadSavingsUsersFromPrisma();
        if (userIds.length === 0) return;

        const ratePercent = Math.round(rate * 10000) / 100;
        const title = "Nouveau taux d'épargne";
        const body = `Le taux d'épargne est désormais de ${ratePercent}%.`;

        if (dbDriver === "mariadb") {
            await this.saveNotificationsWithDrizzle(userIds, title, body);
        } else {
            await this.saveNotificationsWithPrisma(userIds, title, body);
        }

        const wsUrl = process.env.NOTIFICATIONS_WS_URL || "http://localhost:4001";
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1000);
            await fetch(`${wsUrl}/broadcast`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ ratePercent, userIds }),
                signal: controller.signal,
            }).catch(() => {});
            clearTimeout(timer);
        } catch {
            /* ignore */
        }
    }

    private async loadSavingsUsersFromPrisma(): Promise<string[]> {
        const prisma = this.getPrismaClient();
        if (!prisma) return [];
        const savingsUsers = await prisma.account.findMany({
            where: { type: "SAVINGS", isActive: true },
            select: { userId: true },
        });
        return Array.from(new Set(savingsUsers.map((u) => u.userId)));
    }

    private async loadSavingsUsersFromDrizzle(): Promise<string[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select({ userId: accounts.userId })
            .from(accounts)
            .where(and(eq(accounts.type, "SAVINGS"), eq(accounts.isActive, true)));
        const userIds = rows.map((r) => r.userId);
        return Array.from(new Set(userIds));
    }

    private async saveNotificationsWithPrisma(userIds: string[], title: string, body: string): Promise<void> {
        const prisma = this.getPrismaClient();
        if (!prisma) return;
        await prisma.notification.createMany({
            data: userIds.map((userId) => ({ userId, title, body })),
        });
    }

    private async saveNotificationsWithDrizzle(userIds: string[], title: string, body: string): Promise<void> {
        const db = getDrizzleDb();
        if (userIds.length === 0) return;
        await db.insert(notifications).values(
            userIds.map((userId) => ({
                id: newId(),
                userId,
                title,
                body,
            })),
        );
    }

    private getPrismaClient(): PrismaClient | null {
        if (this.prisma) return this.prisma;
        if (resolveDbDriver() !== "postgres") return null;
        this.prisma = new PrismaClient();
        return this.prisma;
    }
}
