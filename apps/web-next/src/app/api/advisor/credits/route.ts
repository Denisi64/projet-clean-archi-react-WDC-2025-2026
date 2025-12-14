export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GrantCreditUseCase } from "@/server/application/credits/GrantCreditUseCase";
import { PrismaCreditRepository } from "@/server/infrastructure/credits/PrismaCreditRepository";

const isDev = process.env.NODE_ENV !== "production";

const schema = z.object({
    userId: z.string().min(1),
    principal: z.number().positive(),
    annualRate: z.number().positive(),
    insuranceRate: z.number().min(0),
    termMonths: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor credits] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    try {
        const uc = new GrantCreditUseCase(new PrismaCreditRepository());
        const credit = await uc.execute(parsed.data);
        return NextResponse.json({ ok: true, credit }, { status: 201 });
    } catch (e: any) {
        if (isDev) console.error("[advisor credits] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
