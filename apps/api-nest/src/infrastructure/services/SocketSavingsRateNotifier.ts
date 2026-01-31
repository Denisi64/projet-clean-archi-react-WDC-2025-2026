import { SavingsRateNotifier } from '@proj/application/accounts/ports/SavingsRateNotifier';
import { resolveDbDriver } from '@proj/infra';
import { getDrizzleDb } from '@proj/infra';
import { accounts, notifications } from '@proj/infra';
import { newId } from '@proj/infra';
import { PrismaClient } from '@prisma/client';
import { and, eq } from 'drizzle-orm';
import { NotificationsGateway } from '../../interface/websocket/notifications.gateway';

export class SocketSavingsRateNotifier implements SavingsRateNotifier {
  constructor(
    private readonly prisma: PrismaClient | null,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notifyRateChanged(rate: number): Promise<void> {
    const dbDriver = resolveDbDriver();
    const userIds =
      dbDriver === 'mariadb'
        ? await this.loadSavingsUsersFromDrizzle()
        : await this.loadSavingsUsersFromPrisma();
    if (userIds.length === 0) return;

    const ratePercent = Math.round(rate * 10000) / 100;
    const title = "Nouveau taux d'épargne";
    const body = `Le taux d'épargne est désormais de ${ratePercent}%.`;

    if (dbDriver === 'mariadb') {
      await this.saveNotificationsWithDrizzle(userIds, title, body);
    } else {
      await this.saveNotificationsWithPrisma(userIds, title, body);
    }

    this.gateway.broadcastSavingsRateChange({ ratePercent, userIds });

    const wsUrl = process.env.NOTIFICATIONS_WS_URL || 'http://localhost:4001';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      await fetch(`${wsUrl}/broadcast`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ratePercent, userIds }),
        signal: controller.signal,
      }).catch(() => {});
      clearTimeout(timer);
    } catch {
      /* ignore */
    }
  }

  private async loadSavingsUsersFromPrisma(): Promise<string[]> {
    if (!this.prisma) return [];
    const savingsUsers = await this.prisma.account.findMany({
      where: { type: 'SAVINGS', isActive: true },
      select: { userId: true },
    });
    return Array.from(new Set(savingsUsers.map((u) => u.userId)));
  }

  private async loadSavingsUsersFromDrizzle(): Promise<string[]> {
    const db = getDrizzleDb();
    const rows = await db
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(eq(accounts.type, 'SAVINGS'), eq(accounts.isActive, true)));
    const activeUserIds = rows.map((r) => r.userId);
    return Array.from(new Set(activeUserIds));
  }

  private async saveNotificationsWithPrisma(
    userIds: string[],
    title: string,
    body: string,
  ): Promise<void> {
    if (!this.prisma) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, body })),
    });
  }

  private async saveNotificationsWithDrizzle(
    userIds: string[],
    title: string,
    body: string,
  ): Promise<void> {
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
}
