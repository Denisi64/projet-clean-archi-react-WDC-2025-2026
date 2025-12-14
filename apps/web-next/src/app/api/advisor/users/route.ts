export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SearchUsersUseCase } from "@/server/application/users/SearchUsersUseCase";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";

const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
    const token = req.headers.get("x-advisor-token");
    const expected = process.env.ADVISOR_TOKEN ?? "dev-advisor";
    if (!token || token !== expected) {
        return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor users] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const queryParam = req.nextUrl.searchParams.get("query") ?? "";
    const schema = z.string().min(2);
    const parsed = schema.safeParse(queryParam);
    if (!parsed.success) {
        return NextResponse.json({ users: [] });
    }

    try {
        const uc = new SearchUsersUseCase(new PrismaUserQueryRepository());
        const users = await uc.execute(parsed.data);
        return NextResponse.json({ users });
    } catch (e: any) {
        if (isDev) console.error("[advisor users] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
