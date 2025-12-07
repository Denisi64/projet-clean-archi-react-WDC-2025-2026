export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaTransferRepository } from "@/server/infrastructure/accounts/PrismaTransferRepository";
import { ListTransfersForUserUseCase } from "@/server/application/accounts/ListTransfersForUserUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";

const prisma = new PrismaClient();
const repo = new PrismaTransferRepository(prisma);
const listTransfersUC = new ListTransfersForUserUseCase(repo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

async function handleUseCase(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }
    const accountId = req.nextUrl.searchParams.get("accountId") || undefined;

    try {
        const transfers = await listTransfersUC.execute(userId, accountId);
        return NextResponse.json({
            transfers: transfers.map((t) => ({
                ...t,
                createdAt: t.createdAt.toISOString(),
            })),
        });
    } catch (e: any) {
        if (isDev) console.error("[transfer history] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const accountId = req.nextUrl.searchParams.get("accountId");
    const url = `${base}/transfers/me${accountId ? `?accountId=${encodeURIComponent(accountId)}` : ""}`;

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
        if (isDev) console.error("[transfer history proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
