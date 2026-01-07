import { and, eq } from "drizzle-orm";
import { ActionTradeRepository } from "@proj/domain/actions/ports/ActionTradeRepository";
import { ActionSnapshot } from "@proj/domain/actions/ports/ActionRepository";
import { PortfolioPosition } from "@proj/domain/actions/ports/PortfolioRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { actions, orders, portfolio } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleActionTradeRepository implements ActionTradeRepository {
    private toSnapshot(action: any): ActionSnapshot {
        return {
            id: action.id,
            symbol: action.symbol,
            name: action.name,
            price: action.price.toString(),
            availableStock: action.availableStock.toString(),
            isAvailable: !!action.isAvailable,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
        };
    }

    private toPosition(position: any): PortfolioPosition {
        return {
            userId: position.userId,
            actionId: position.actionId,
            quantity: position.quantity.toString(),
            avgPrice: position.avgPrice.toString(),
        };
    }

    async executeBuy(input: {
        userId: string;
        actionId: string;
        quantity: string;
        price: string;
        nextStock: string;
        nextQuantity: string;
        nextAvgPrice: string;
    }): Promise<{ action: ActionSnapshot; position: PortfolioPosition }> {
        const db = getDrizzleDb();
        const actionId = input.actionId;
        const positionId = newId();

        const result = await db.transaction(async (tx) => {
            await tx.update(actions).set({ availableStock: input.nextStock }).where(eq(actions.id, actionId));
            await tx
                .insert(portfolio)
                .values({
                    id: positionId,
                    userId: input.userId,
                    actionId: input.actionId,
                    quantity: input.nextQuantity,
                    avgPrice: input.nextAvgPrice,
                })
                .onDuplicateKeyUpdate({
                    set: { quantity: input.nextQuantity, avgPrice: input.nextAvgPrice },
                });
            await tx.insert(orders).values({
                id: newId(),
                userId: input.userId,
                actionId: input.actionId,
                side: "BUY",
                quantity: input.quantity,
                limitPrice: input.price,
                status: "FILLED",
                filledAt: new Date(),
            });

            const [actionRow] = await tx.select().from(actions).where(eq(actions.id, actionId)).limit(1);
            const [positionRow] = await tx
                .select()
                .from(portfolio)
                .where(and(eq(portfolio.userId, input.userId), eq(portfolio.actionId, input.actionId)))
                .limit(1);

            return { action: actionRow, position: positionRow };
        });

        return { action: this.toSnapshot(result.action), position: this.toPosition(result.position) };
    }

    async executeSell(input: {
        userId: string;
        actionId: string;
        quantity: string;
        price: string;
        nextStock: string;
        nextQuantity: string;
        nextAvgPrice: string;
    }): Promise<{ action: ActionSnapshot; position: PortfolioPosition }> {
        const db = getDrizzleDb();
        const actionId = input.actionId;
        const positionId = newId();

        const result = await db.transaction(async (tx) => {
            await tx.update(actions).set({ availableStock: input.nextStock }).where(eq(actions.id, actionId));
            await tx
                .insert(portfolio)
                .values({
                    id: positionId,
                    userId: input.userId,
                    actionId: input.actionId,
                    quantity: input.nextQuantity,
                    avgPrice: input.nextAvgPrice,
                })
                .onDuplicateKeyUpdate({
                    set: { quantity: input.nextQuantity, avgPrice: input.nextAvgPrice },
                });
            await tx.insert(orders).values({
                id: newId(),
                userId: input.userId,
                actionId: input.actionId,
                side: "SELL",
                quantity: input.quantity,
                limitPrice: input.price,
                status: "FILLED",
                filledAt: new Date(),
            });

            const [actionRow] = await tx.select().from(actions).where(eq(actions.id, actionId)).limit(1);
            const [positionRow] = await tx
                .select()
                .from(portfolio)
                .where(and(eq(portfolio.userId, input.userId), eq(portfolio.actionId, input.actionId)))
                .limit(1);

            return { action: actionRow, position: positionRow };
        });

        return { action: this.toSnapshot(result.action), position: this.toPosition(result.position) };
    }
}
