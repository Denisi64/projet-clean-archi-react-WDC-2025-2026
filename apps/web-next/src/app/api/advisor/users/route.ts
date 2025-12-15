export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SearchUsersUseCase } from "@/server/application/users/SearchUsersUseCase";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";

const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor users] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const queryParam = req.nextUrl.searchParams.get("query") ?? "";
    const schema = z.string().optional();
    const parsed = schema.safeParse(queryParam);

    try {
        const uc = new SearchUsersUseCase(new PrismaUserQueryRepository());
        const users = await uc.execute(parsed.success ? parsed.data ?? "" : "");
        return NextResponse.json({ users });
    } catch (e: any) {
        if (isDev) console.error("[advisor users] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
