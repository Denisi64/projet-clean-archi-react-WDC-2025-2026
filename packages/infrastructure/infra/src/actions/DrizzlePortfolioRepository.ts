import { and, desc, eq } from "drizzle-orm";
import { PortfolioRepository, PortfolioPosition, PortfolioView } from "@proj/domain/actions/ports/PortfolioRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { actions, portfolio } from "../db/drizzle/schema";

export class DrizzlePortfolioRepository implements PortfolioRepository {
    private toPosition(row: any): PortfolioPosition {
        return {
            userId: row.userId,
            actionId: row.actionId,
            quantity: row.quantity.toString(),
            avgPrice: row.avgPrice.toString(),
        };
    }

    async findPosition(userId: string, actionId: string): Promise<PortfolioPosition | null> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(portfolio)
            .where(and(eq(portfolio.userId, userId), eq(portfolio.actionId, actionId)))
            .limit(1);
        return rows[0] ? this.toPosition(rows[0]) : null;
    }

    async listByUser(userId: string): Promise<PortfolioView[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select({
                actionId: portfolio.actionId,
                quantity: portfolio.quantity,
                avgPrice: portfolio.avgPrice,
                symbol: actions.symbol,
                name: actions.name,
                price: actions.price,
                isAvailable: actions.isAvailable,
                updatedAt: portfolio.updatedAt,
            })
            .from(portfolio)
            .innerJoin(actions, eq(portfolio.actionId, actions.id))
            .where(eq(portfolio.userId, userId))
            .orderBy(desc(portfolio.updatedAt));

        return rows.map((pos) => ({
            actionId: pos.actionId,
            symbol: pos.symbol,
            name: pos.name,
            price: pos.price.toString(),
            isAvailable: !!pos.isAvailable,
            quantity: pos.quantity.toString(),
            avgPrice: pos.avgPrice.toString(),
        }));
    }
}
