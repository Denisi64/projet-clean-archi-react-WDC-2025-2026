import { desc, eq } from "drizzle-orm";
import { SavingsRateRepository } from "@proj/domain/accounts/ports/SavingsRateRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { tauxEpargne } from "../db/drizzle/schema";

const DEFAULT_RATE_ID = "global-rate";

export class DrizzleSavingsRateRepository implements SavingsRateRepository {
    async getActiveRate(): Promise<number | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(tauxEpargne)
            .where(eq(tauxEpargne.active, true))
            .orderBy(desc(tauxEpargne.updatedAt))
            .limit(1);
        const current = rows[0];
        if (!current) return null;
        const rateNumber = Number(current.rate);
        return Number.isFinite(rateNumber) ? rateNumber : null;
    }

    async saveRate(rate: number): Promise<void> {
        const db = getDrizzleDb();
        const existing = await db
            .select({ id: tauxEpargne.id })
            .from(tauxEpargne)
            .where(eq(tauxEpargne.id, DEFAULT_RATE_ID))
            .limit(1);
        if (existing.length === 0) {
            await db.insert(tauxEpargne).values({
                id: DEFAULT_RATE_ID,
                rate: rate.toString(),
                active: true,
            });
        } else {
            await db
                .update(tauxEpargne)
                .set({ rate: rate.toString(), active: true })
                .where(eq(tauxEpargne.id, DEFAULT_RATE_ID));
        }
    }
}
