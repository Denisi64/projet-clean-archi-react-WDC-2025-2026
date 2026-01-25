export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { CreateNewsUseCase } from "@proj/application/news/CreateNewsUseCase";
import { ListNewsUseCase } from "@proj/application/news/ListNewsUseCase";
import { createNewsRepository, createUserQueryRepository } from "@proj/infra";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const repo = createNewsRepository();
const listNewsUC = new ListNewsUseCase(repo);
const createNewsUC = new CreateNewsUseCase(repo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const createSchema = z.object({
    title: z.string().trim().min(2),
    body: z.string().trim().max(2000).optional().nullable(),
});

async function requireRole(req: NextRequest, roles: ("CLIENT" | "ADVISOR" | "DIRECTOR")[]) {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: roles });
    if (!auth.ok) {
        const e = auth.error;
        if (e instanceof UnauthorizedAccessError) {
            return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
        }
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "ROLE_NOT_ALLOWED" }, { status: 403 });
        }
        if (e instanceof BannedAccountError) {
            return NextResponse.json({ code: "ACCOUNT_BANNED" }, { status: 403 });
        }
        if (isDev) console.error("[news] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId, role: auth.value.role };
}

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireRole(req, ["CLIENT"]);
    if (auth instanceof NextResponse) return auth;

    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 0, 1), 100) : 30;

    const result = await listNewsUC.execute({ limit });
    if (!result.ok) {
        if (isDev) console.error("[news list] error:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ news: result.value.news });
}

export async function POST(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const result = await createNewsUC.execute({
        actorRole: auth.role,
        actorId: auth.userId,
        title: parsed.data.title,
        body: parsed.data.body ?? null,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "ROLE_NOT_ALLOWED" }, { status: 403 });
        }
        if (isDev) console.error("[news create] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json(
        { id: result.value.id, createdAt: result.value.createdAt.toISOString() },
        { status: 201 },
    );
}
