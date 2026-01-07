export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ApplyDailySavingsInterestUseCase } from "@proj/application/accounts/ApplyDailySavingsInterestUseCase";
import { PrismaInterestRateProvider } from "@proj/infra/accounts/PrismaInterestRateProvider";
import { createSavingsInterestRepository, createSavingsRateRepository } from "@proj/infra";

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

    const modeParam = req.nextUrl.searchParams.get("mode");
    const mode = modeParam === "annual" ? "annual" : "daily";
    const uc = new ApplyDailySavingsInterestUseCase(
        createSavingsInterestRepository(),
        new PrismaInterestRateProvider(createSavingsRateRepository()),
    );
    const result = await uc.execute({ mode });
    if (!result.ok) {
        if (isDev) console.error("[savings] apply-interest error:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, applied: result.value, mode });
}
