import { Prisma, PrismaClient } from "@prisma/client";
import { ActionTradeRepository } from "../../domain/actions/ports/ActionTradeRepository";
import { ActionSnapshot } from "../../domain/actions/ports/ActionRepository";
import { PortfolioPosition } from "../../domain/actions/ports/PortfolioRepository";

export class PrismaActionTradeRepository implements ActionTradeRepository {
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
        const result = await this.prisma.$transaction(async (tx) => {
            const action = await tx.action.update({
                where: { id: input.actionId },
                data: { availableStock: new Prisma.Decimal(input.nextStock) },
            });
            const position = await tx.portfolio.upsert({
                where: { userId_actionId: { userId: input.userId, actionId: input.actionId } },
                update: {
                    quantity: new Prisma.Decimal(input.nextQuantity),
                    avgPrice: new Prisma.Decimal(input.nextAvgPrice),
                },
                create: {
                    userId: input.userId,
                    actionId: input.actionId,
                    quantity: new Prisma.Decimal(input.nextQuantity),
                    avgPrice: new Prisma.Decimal(input.nextAvgPrice),
                },
            });
            await tx.order.create({
                data: {
                    userId: input.userId,
                    actionId: input.actionId,
                    side: "BUY",
                    quantity: new Prisma.Decimal(input.quantity),
                    limitPrice: new Prisma.Decimal(input.price),
                    status: "FILLED",
                    filledAt: new Date(),
                },
            });
            return { action, position };
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
        const result = await this.prisma.$transaction(async (tx) => {
            const action = await tx.action.update({
                where: { id: input.actionId },
                data: { availableStock: new Prisma.Decimal(input.nextStock) },
            });
            const position = await tx.portfolio.upsert({
                where: { userId_actionId: { userId: input.userId, actionId: input.actionId } },
                update: {
                    quantity: new Prisma.Decimal(input.nextQuantity),
                    avgPrice: new Prisma.Decimal(input.nextAvgPrice),
                },
                create: {
                    userId: input.userId,
                    actionId: input.actionId,
                    quantity: new Prisma.Decimal(input.nextQuantity),
                    avgPrice: new Prisma.Decimal(input.nextAvgPrice),
                },
            });
            await tx.order.create({
                data: {
                    userId: input.userId,
                    actionId: input.actionId,
                    side: "SELL",
                    quantity: new Prisma.Decimal(input.quantity),
                    limitPrice: new Prisma.Decimal(input.price),
                    status: "FILLED",
                    filledAt: new Date(),
                },
            });
            return { action, position };
        });

        return { action: this.toSnapshot(result.action), position: this.toPosition(result.position) };
    }
}
