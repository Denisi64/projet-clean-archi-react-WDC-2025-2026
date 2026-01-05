import { Prisma, PrismaClient } from "@prisma/client";
import {
    ActionRepository,
    ActionSnapshot,
    CreateActionInput,
    UpdateActionInput,
} from "@proj/domain/actions/ports/ActionRepository";
import { ActionNotFoundError } from "@proj/domain/actions/errors/ActionNotFoundError";
import { ActionInUseError } from "@proj/domain/actions/errors/ActionInUseError";

export class PrismaActionRepository implements ActionRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private toSnapshot(action: any): ActionSnapshot {
        return {
            id: action.id,
            symbol: action.symbol,
            name: action.name,
            price: action.price.toString(),
            availableStock: action.availableStock.toString(),
            isAvailable: action.isAvailable,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
        };
    }

    async findById(id: string): Promise<ActionSnapshot | null> {
        const action = await this.prisma.action.findUnique({ where: { id } });
        return action ? this.toSnapshot(action) : null;
    }

    async findBySymbol(symbol: string): Promise<ActionSnapshot | null> {
        const action = await this.prisma.action.findUnique({ where: { symbol } });
        return action ? this.toSnapshot(action) : null;
    }

    async listAll(): Promise<ActionSnapshot[]> {
        const actions = await this.prisma.action.findMany({ orderBy: { symbol: "asc" } });
        return actions.map((action) => this.toSnapshot(action));
    }

    async listAvailable(): Promise<ActionSnapshot[]> {
        const actions = await this.prisma.action.findMany({
            where: { isAvailable: true },
            orderBy: { symbol: "asc" },
        });
        return actions.map((action) => this.toSnapshot(action));
    }

    async create(input: CreateActionInput): Promise<ActionSnapshot> {
        const created = await this.prisma.action.create({
            data: {
                symbol: input.symbol,
                name: input.name,
                price: new Prisma.Decimal(input.price),
                availableStock: new Prisma.Decimal(input.availableStock),
                isAvailable: input.isAvailable,
            },
        });
        return this.toSnapshot(created);
    }

    async update(input: UpdateActionInput): Promise<ActionSnapshot> {
        const existing = await this.prisma.action.findUnique({ where: { id: input.id } });
        if (!existing) {
            throw new ActionNotFoundError();
        }
        const updated = await this.prisma.action.update({
            where: { id: input.id },
            data: {
                name: input.name ?? undefined,
                isAvailable: typeof input.isAvailable === "boolean" ? input.isAvailable : undefined,
            },
        });
        return this.toSnapshot(updated);
    }

    async delete(id: string): Promise<ActionSnapshot> {
        const existing = await this.prisma.action.findUnique({ where: { id } });
        if (!existing) {
            throw new ActionNotFoundError();
        }
        const [order, portfolio] = await Promise.all([
            this.prisma.order.findFirst({ where: { actionId: id }, select: { id: true } }),
            this.prisma.portfolio.findFirst({ where: { actionId: id }, select: { id: true } }),
        ]);
        if (order || portfolio) {
            throw new ActionInUseError();
        }
        const deleted = await this.prisma.action.delete({ where: { id } });
        return this.toSnapshot(deleted);
    }
}
