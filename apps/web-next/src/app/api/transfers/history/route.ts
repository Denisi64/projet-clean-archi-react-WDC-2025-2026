export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaTransferRepository } from "@/server/infrastructure/accounts/PrismaTransferRepository";
import { ListTransfersForUserUseCase } from "@/server/application/accounts/ListTransfersForUserUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@/server/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@/server/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@/server/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@/server/domain/auth/errors/BannedAccountError";

const prisma = new PrismaClient();
const repo = new PrismaTransferRepository(prisma);
const listTransfersUC = new ListTransfersForUserUseCase(repo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository(prisma);
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

async function requireClient(req: NextRequest): Promise<{ userId: string } | NextResponse> {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["CLIENT"] });
    if (!auth.ok) {
        const e = auth.error;
        if (e instanceof UnauthorizedAccessError) {
            return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
        }
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (e instanceof BannedAccountError) {
            return NextResponse.json({ code: "ACCOUNT_BANNED" }, { status: 403 });
        }
        if (isDev) console.error("[transfer history] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId };
}

async function handleUseCase(req: NextRequest) {
    const auth = await requireClient(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    const accountId = req.nextUrl.searchParams.get("accountId") || undefined;

    const result = await listTransfersUC.execute(userId, accountId);
    if (!result.ok) {
        if (isDev) console.error("[transfer history] unexpected:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json({
        transfers: result.value.map((t) => ({
            ...t,
            createdAt: t.createdAt.toISOString(),
        })),
    });
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
