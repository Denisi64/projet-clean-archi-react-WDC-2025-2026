import { PrismaClient } from "@prisma/client";
import { PortfolioRepository, PortfolioPosition, PortfolioView } from "@proj/domain/actions/ports/PortfolioRepository";

export class PrismaPortfolioRepository implements PortfolioRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private toPosition(row: any): PortfolioPosition {
        return {
            userId: row.userId,
            actionId: row.actionId,
            quantity: row.quantity.toString(),
            avgPrice: row.avgPrice.toString(),
        };
    }

    async findPosition(userId: string, actionId: string): Promise<PortfolioPosition | null> {
        const position = await this.prisma.portfolio.findUnique({
            where: { userId_actionId: { userId, actionId } },
        });
        return position ? this.toPosition(position) : null;
    }

    async listByUser(userId: string): Promise<PortfolioView[]> {
        const positions = await this.prisma.portfolio.findMany({
            where: { userId },
            include: { action: true },
            orderBy: { updatedAt: "desc" },
        });
        return positions.map((pos) => ({
            actionId: pos.actionId,
            symbol: pos.action.symbol,
            name: pos.action.name,
            price: pos.action.price.toString(),
            isAvailable: pos.action.isAvailable,
            quantity: pos.quantity.toString(),
            avgPrice: pos.avgPrice.toString(),
        }));
    }
}
