import { Prisma, PrismaClient } from "@prisma/client";
import { CreditRepository, CreditDetail } from "../../domain/credits/ports/CreditRepository";

export class PrismaCreditRepository implements CreditRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    private toDetail(c: any): CreditDetail {
        return {
            id: c.id,
            userId: c.userId,
            principal: c.principal.toString(),
            initialPrincipal: c.initialPrincipal.toString(),
            remainingPrincipal: c.remainingPrincipal.toString(),
            annualRate: Number(c.annualRate),
            insuranceRate: Number(c.insuranceRate ?? 0),
            termMonths: c.termMonths,
            remainingTermMonths: c.remainingTermMonths,
            monthlyDue: c.monthlyDue.toString(),
            monthlyInsurance: c.monthlyInsurance.toString(),
            status: c.status,
            createdAt: c.createdAt,
            repaidAt: c.repaidAt ?? null,
        };
    }

    async create(input: {
        userId: string;
        principal: string;
        initialPrincipal: string;
        remainingPrincipal: string;
        annualRate: number;
        insuranceRate: number;
        termMonths: number;
        remainingTermMonths: number;
        monthlyDue: string;
        monthlyInsurance: string;
    }): Promise<CreditDetail> {
        const created = await this.prisma.credit.create({
            data: {
                userId: input.userId,
                principal: new Prisma.Decimal(input.principal),
                initialPrincipal: new Prisma.Decimal(input.initialPrincipal),
                remainingPrincipal: new Prisma.Decimal(input.remainingPrincipal),
                annualRate: new Prisma.Decimal(input.annualRate),
                insuranceRate: new Prisma.Decimal(input.insuranceRate),
                termMonths: input.termMonths,
                remainingTermMonths: input.remainingTermMonths,
                monthlyDue: new Prisma.Decimal(input.monthlyDue),
                monthlyInsurance: new Prisma.Decimal(input.monthlyInsurance),
                status: "ACTIVE",
            },
        });

        return this.toDetail(created);
    }

    async findById(id: string): Promise<CreditDetail | null> {
        const c = await this.prisma.credit.findUnique({ where: { id } });
        return c ? this.toDetail(c) : null;
    }

    async save(credit: CreditDetail): Promise<CreditDetail> {
        const updated = await this.prisma.credit.update({
            where: { id: credit.id },
            data: {
                remainingPrincipal: new Prisma.Decimal(credit.remainingPrincipal),
                remainingTermMonths: credit.remainingTermMonths,
                status: credit.status,
                repaidAt: credit.repaidAt ?? undefined,
            },
        });

        return this.toDetail(updated);
    }

    async listByUser(userId: string): Promise<CreditDetail[]> {
        const credits = await this.prisma.credit.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return credits.map((c) => this.toDetail(c));
    }
}
