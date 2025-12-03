export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { PrismaTransferRepository } from "../../../../../../api-nest/src/infrastructure/repositories/PrismaTransferRepository";
import { ListTransfersForUserUseCase } from "../../../../../../api-nest/src/application/accounts/ListTransfersForUserUseCase";

const prisma = new PrismaClient();
const repo = new PrismaTransferRepository(prisma);
const listTransfersUC = new ListTransfersForUserUseCase(repo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

function getUserIdFromSession(req: NextRequest): string | null {
    const session = req.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const payload = jwt.verify(session, process.env.JWT_SECRET ?? "dev-secret") as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[transfer history] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest) {
    const userId = getUserIdFromSession(req);
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
