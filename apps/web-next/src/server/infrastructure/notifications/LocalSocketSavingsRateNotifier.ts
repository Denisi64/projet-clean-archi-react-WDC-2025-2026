import { PrismaClient } from "@prisma/client";
import { SavingsRateNotifier } from "../../application/accounts/ports/SavingsRateNotifier";

export class LocalSocketSavingsRateNotifier implements SavingsRateNotifier {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async notifyRateChanged(rate: number): Promise<void> {
        const savingsUsers = await this.prisma.account.findMany({
            where: { type: "SAVINGS", isActive: true },
            select: { userId: true },
        });
        const userIds = Array.from(new Set(savingsUsers.map((u) => u.userId)));
        if (userIds.length === 0) return;

        const ratePercent = Math.round(rate * 10000) / 100;
        const title = "Nouveau taux d'épargne";
        const body = `Le taux d'épargne est désormais de ${ratePercent}%.`;

        await this.prisma.notification.createMany({
            data: userIds.map((userId) => ({ userId, title, body })),
        });

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
}
