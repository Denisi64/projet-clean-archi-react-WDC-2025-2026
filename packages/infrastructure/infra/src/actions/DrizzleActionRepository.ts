import { and, asc, eq } from "drizzle-orm";
import {
    ActionRepository,
    ActionSnapshot,
    CreateActionInput,
    UpdateActionInput,
} from "@proj/domain/actions/ports/ActionRepository";
import { ActionNotFoundError } from "@proj/domain/actions/errors/ActionNotFoundError";
import { ActionInUseError } from "@proj/domain/actions/errors/ActionInUseError";
import { getDrizzleDb } from "../db/drizzle/client";
import { actions, orders, portfolio } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleActionRepository implements ActionRepository {
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

    async findById(id: string): Promise<ActionSnapshot | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(actions).where(eq(actions.id, id)).limit(1);
        return rows[0] ? this.toSnapshot(rows[0]) : null;
    }

    async findBySymbol(symbol: string): Promise<ActionSnapshot | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(actions).where(eq(actions.symbol, symbol)).limit(1);
        return rows[0] ? this.toSnapshot(rows[0]) : null;
    }

    async listAll(): Promise<ActionSnapshot[]> {
        const db = getDrizzleDb();
        const rows = await db.select().from(actions).orderBy(asc(actions.symbol));
        return rows.map((action) => this.toSnapshot(action));
    }

    async listAvailable(): Promise<ActionSnapshot[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(actions)
            .where(eq(actions.isAvailable, true))
            .orderBy(asc(actions.symbol));
        return rows.map((action) => this.toSnapshot(action));
    }

    async create(input: CreateActionInput): Promise<ActionSnapshot> {
        const db = getDrizzleDb();
        const id = newId();
        await db.insert(actions).values({
            id,
            symbol: input.symbol,
            name: input.name,
            price: input.price,
            availableStock: input.availableStock,
            isAvailable: input.isAvailable,
        });
        const rows = await db.select().from(actions).where(eq(actions.id, id)).limit(1);
        return this.toSnapshot(rows[0]);
    }

    async update(input: UpdateActionInput): Promise<ActionSnapshot> {
        const db = getDrizzleDb();
        const existing = await db.select().from(actions).where(eq(actions.id, input.id)).limit(1);
        if (!existing[0]) {
            throw new ActionNotFoundError();
        }
        await db
            .update(actions)
            .set({
                name: input.name ?? existing[0].name,
                isAvailable: typeof input.isAvailable === "boolean" ? input.isAvailable : existing[0].isAvailable,
            })
            .where(eq(actions.id, input.id));
        const rows = await db.select().from(actions).where(eq(actions.id, input.id)).limit(1);
        return this.toSnapshot(rows[0]);
    }

    async delete(id: string): Promise<ActionSnapshot> {
        const db = getDrizzleDb();
        const existing = await db.select().from(actions).where(eq(actions.id, id)).limit(1);
        if (!existing[0]) {
            throw new ActionNotFoundError();
        }
        const [orderRow, portfolioRow] = await Promise.all([
            db.select({ id: orders.id }).from(orders).where(eq(orders.actionId, id)).limit(1),
            db.select({ id: portfolio.id }).from(portfolio).where(eq(portfolio.actionId, id)).limit(1),
        ]);
        if (orderRow[0] || portfolioRow[0]) {
            throw new ActionInUseError();
        }
        await db.delete(actions).where(eq(actions.id, id));
        return this.toSnapshot(existing[0]);
    }
}
