export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

function getUserIdFromSession(token: string | undefined): string | null {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[accounts] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = getUserIdFromSession(session);
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
        accounts: accounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            iban: acc.iban,
            type: acc.type,
            balance: acc.balance.toString(),
            isActive: acc.isActive,
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
