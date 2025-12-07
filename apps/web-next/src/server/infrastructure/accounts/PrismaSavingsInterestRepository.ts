import { Prisma, PrismaClient } from "@prisma/client";
import { SavingsInterestRepository } from "../../domain/accounts/ports/SavingsInterestRepository";

export class PrismaSavingsInterestRepository implements SavingsInterestRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async listActiveSavingsAccounts() {
        const accounts = await this.prisma.account.findMany({
            where: { type: "SAVINGS", isActive: true },
            select: { id: true, balance: true, isActive: true },
            orderBy: { createdAt: "asc" },
        });
        return accounts.map((a) => ({
            id: a.id,
            balance: a.balance.toString(),
            isActive: a.isActive,
        }));
    }

    async creditInterest(input: { accountId: string; amount: string; note?: string }) {
        const amount = new Prisma.Decimal(input.amount);
        await this.prisma.$transaction(async (tx) => {
            await tx.operation.create({
                data: {
                    accountId: input.accountId,
                    kind: "CREDIT",
                    amount,
                    metadata: input.note ?? "DAILY_INTEREST",
                },
            });

            await tx.account.update({
                where: { id: input.accountId },
                data: { balance: { increment: amount } },
            });
        });
    }
}
