export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GetUserAccountsUseCase } from "@/server/application/accounts/GetUserAccountsUseCase";
import { PrismaAccountRepository } from "@/server/infrastructure/accounts/PrismaAccountRepository";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";

function getUserIdFromSession(token: string | undefined): string | null {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, jwtSecret) as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[accounts] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[accounts] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const session = req.cookies.get("session")?.value;
    const userId = getUserIdFromSession(session);
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const repo = new PrismaAccountRepository();
    const uc = new GetUserAccountsUseCase(repo);
    const accounts = await uc.execute(userId);

    return NextResponse.json({
        accounts: accounts.map((acc) => ({
            ...acc,
            createdAt: acc.createdAt.toISOString(),
        })),
    });
}

async function handleProxy(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    if (!session) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/accounts/me`;

    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[accounts-proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
