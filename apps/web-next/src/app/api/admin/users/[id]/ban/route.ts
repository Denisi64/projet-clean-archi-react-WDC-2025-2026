export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaUserAdminRepository } from "@/server/infrastructure/users/PrismaUserAdminRepository";
import { BanUserUseCase } from "@/server/application/users/BanUserUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@/server/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@/server/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@/server/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@/server/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const prisma = new PrismaClient();
const adminRepo = new PrismaUserAdminRepository(prisma);
const banUserUC = new BanUserUseCase(adminRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository(prisma);
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

async function requireDirector(req: NextRequest): Promise<NextResponse | null> {
    const session = req.cookies.get("session")?.value ?? null;
    try {
        await getUserRoleUC.execute({ token: session, requiredRoles: ["DIRECTOR"] });
    } catch (e: any) {
        if (e instanceof UnauthorizedAccessError) {
            return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
        }
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (e instanceof BannedAccountError) {
            return NextResponse.json({ code: "ACCOUNT_BANNED" }, { status: 403 });
        }
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return null;
}

async function handleUseCase(req: NextRequest, userId: string) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[admin users ban] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const authError = await requireDirector(req);
    if (authError) return authError;

    const user = await banUserUC.execute(userId);
    return NextResponse.json({ ok: true, user });
}

async function handleProxy(req: NextRequest, userId: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/admin/users/${userId}/ban`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[admin users ban] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return target === "next" ? handleUseCase(req, id) : handleProxy(req, id);
}
