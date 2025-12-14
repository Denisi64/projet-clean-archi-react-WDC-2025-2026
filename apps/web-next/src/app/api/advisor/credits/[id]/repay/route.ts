export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RepayCreditUseCase } from "@/server/application/credits/RepayCreditUseCase";
import { PrismaCreditRepository } from "@/server/infrastructure/credits/PrismaCreditRepository";
import { CreditNotFoundError } from "@/server/domain/credits/errors/CreditNotFoundError";
import { CreditInactiveError } from "@/server/domain/credits/errors/CreditInactiveError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const paramsSchema = z.object({ id: z.string().min(1) });

async function handleUseCase(id: string) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor repay] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const uc = new RepayCreditUseCase(new PrismaCreditRepository());
    try {
        const credit = await uc.execute(id);
        return NextResponse.json({ ok: true, credit });
    } catch (e: any) {
        if (e instanceof CreditNotFoundError) {
            return NextResponse.json({ code: "CREDIT_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof CreditInactiveError) {
            return NextResponse.json({ code: "CREDIT_INACTIVE" }, { status: 409 });
        }
        if (isDev) console.error("[advisor repay] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest, id: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/advisor/credits/${id}/repay`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "x-advisor-token": req.headers.get("x-advisor-token") ?? "",
            },
        });
        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[advisor repay proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    return target === "next" ? handleUseCase(parsedParams.data.id) : handleProxy(req, parsedParams.data.id);
}
