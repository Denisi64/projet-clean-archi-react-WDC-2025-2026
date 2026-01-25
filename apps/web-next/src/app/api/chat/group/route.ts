export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { createGroupChatRepository, createUserQueryRepository } from "@proj/infra";
import { ListGroupChatMessagesUseCase } from "@proj/application/chat/ListGroupChatMessagesUseCase";
import { CreateGroupChatMessageUseCase } from "@proj/application/chat/CreateGroupChatMessageUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const repo = createGroupChatRepository();
const listUC = new ListGroupChatMessagesUseCase(repo);
const createUC = new CreateGroupChatMessageUseCase(repo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const createSchema = z.object({
    content: z.string().trim().min(1).max(2000),
});

async function requireAdvisorOrDirector(req: NextRequest) {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["ADVISOR", "DIRECTOR"] });
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
        if (isDev) console.error("[group chat] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId, role: auth.value.role };
}

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireAdvisorOrDirector(req);
    if (auth instanceof NextResponse) return auth;

    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 0, 1), 100) : 50;

    const result = await listUC.execute({ actorRole: auth.role, limit });
    if (!result.ok) {
        if (isDev) console.error("[group chat list] error:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ messages: result.value.messages });
}

export async function POST(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireAdvisorOrDirector(req);
    if (auth instanceof NextResponse) return auth;

    const raw = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const result = await createUC.execute({
        actorRole: auth.role,
        actorId: auth.userId,
        content: parsed.data.content,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "ROLE_NOT_ALLOWED" }, { status: 403 });
        }
        if (isDev) console.error("[group chat create] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const wsUrl = process.env.NOTIFICATIONS_WS_URL || "http://localhost:4001";
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1000);
        await fetch(`${wsUrl}/broadcast-group`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(result.value),
            signal: controller.signal,
        }).catch(() => {});
        clearTimeout(timer);
    } catch {}

    return NextResponse.json({ message: result.value }, { status: 201 });
}
