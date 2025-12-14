import { Prisma, PrismaClient } from "@prisma/client";
import { CreditRepository, CreditSummary } from "../../domain/credits/ports/CreditRepository";

export class PrismaCreditRepository implements CreditRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private toSummary(c: any): CreditSummary {
        return {
            id: c.id,
            userId: c.userId,
            principal: c.principal.toString(),
            annualRate: Number(c.annualRate),
            insuranceRate: Number(c.insuranceRate ?? 0),
            termMonths: c.termMonths,
            monthlyDue: c.monthlyDue.toString(),
            status: c.status,
            createdAt: c.createdAt,
        };
    }

    async create(input: {
        userId: string;
        principal: string;
        annualRate: number;
        insuranceRate: number;
        termMonths: number;
        monthlyDue: string;
    }): Promise<CreditSummary> {
        const created = await this.prisma.credit.create({
            data: {
                userId: input.userId,
                principal: new Prisma.Decimal(input.principal),
                annualRate: new Prisma.Decimal(input.annualRate),
                termMonths: input.termMonths,
                monthlyDue: new Prisma.Decimal(input.monthlyDue),
                status: "ACTIVE",
            },
        });

        return this.toSummary({ ...created, insuranceRate: input.insuranceRate });
    }
}
