import { desc, eq } from "drizzle-orm";
import { CreditRepository, CreditDetail } from "@proj/domain/credits/ports/CreditRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { credits } from "../db/drizzle/schema";
import { newId } from "../db/drizzle/ids";

export class DrizzleCreditRepository implements CreditRepository {
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
        const db = getDrizzleDb();
        const id = newId();
        await db.insert(credits).values({
            id,
            userId: input.userId,
            principal: input.principal,
            initialPrincipal: input.initialPrincipal,
            remainingPrincipal: input.remainingPrincipal,
            annualRate: input.annualRate.toString(),
            insuranceRate: input.insuranceRate.toString(),
            termMonths: input.termMonths,
            remainingTermMonths: input.remainingTermMonths,
            monthlyDue: input.monthlyDue,
            monthlyInsurance: input.monthlyInsurance,
            status: "ACTIVE",
        });
        const rows = await db.select().from(credits).where(eq(credits.id, id)).limit(1);
        return this.toDetail(rows[0]);
    }

    async findById(id: string): Promise<CreditDetail | null> {
        const db = getDrizzleDb();
        const rows = await db.select().from(credits).where(eq(credits.id, id)).limit(1);
        return rows[0] ? this.toDetail(rows[0]) : null;
    }

    async save(credit: CreditDetail): Promise<CreditDetail> {
        const db = getDrizzleDb();
        await db
            .update(credits)
            .set({
                remainingPrincipal: credit.remainingPrincipal,
                remainingTermMonths: credit.remainingTermMonths,
                status: credit.status,
                repaidAt: credit.repaidAt ?? null,
            })
            .where(eq(credits.id, credit.id));
        const rows = await db.select().from(credits).where(eq(credits.id, credit.id)).limit(1);
        return this.toDetail(rows[0]);
    }

    async listByUser(userId: string): Promise<CreditDetail[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select()
            .from(credits)
            .where(eq(credits.userId, userId))
            .orderBy(desc(credits.createdAt))
            .limit(10);
        return rows.map((c) => this.toDetail(c));
    }
}
