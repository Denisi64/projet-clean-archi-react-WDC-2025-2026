export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createUserAdminRepository, createUserQueryRepository } from "@proj/infra";
import { BanUserUseCase } from "@proj/application/users/BanUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const adminRepo = createUserAdminRepository();
const banUserUC = new BanUserUseCase(adminRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

async function requireDirector(req: NextRequest): Promise<NextResponse | null> {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["DIRECTOR"] });
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

    const result = await banUserUC.execute(userId);
    if (!result.ok) {
        if (isDev) console.error("[admin users ban] unexpected:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, user: result.value });
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
