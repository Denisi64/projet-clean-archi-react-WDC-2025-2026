export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ApplyDailySavingsInterestUseCase } from "@/server/application/accounts/ApplyDailySavingsInterestUseCase";
import { PrismaSavingsInterestRepository } from "@/server/infrastructure/accounts/PrismaSavingsInterestRepository";
import { EnvInterestRateProvider } from "@/server/infrastructure/accounts/EnvInterestRateProvider";

const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
    const adminToken = req.headers.get("x-admin-token");
    const expected = process.env.ADMIN_TOKEN ?? "dev-admin";
    if (!adminToken || adminToken !== expected) {
        return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[savings] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    try {
        const uc = new ApplyDailySavingsInterestUseCase(
            new PrismaSavingsInterestRepository(),
            new EnvInterestRateProvider(),
        );
        const applied = await uc.execute();
        return NextResponse.json({ ok: true, applied });
    } catch (e: any) {
        if (isDev) console.error("[savings] apply-interest error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
