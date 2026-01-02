export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaActionRepository } from "@/server/infrastructure/actions/PrismaActionRepository";
import { UpdateActionUseCase } from "@/server/application/actions/UpdateActionUseCase";
import { DeleteActionUseCase } from "@/server/application/actions/DeleteActionUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@/server/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@/server/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@/server/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@/server/domain/auth/errors/BannedAccountError";
import { ActionNotFoundError } from "@/server/domain/actions/errors/ActionNotFoundError";
import { InvalidActionInputError } from "@/server/domain/actions/errors/InvalidActionInputError";
import { ActionInUseError } from "@/server/domain/actions/errors/ActionInUseError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const prisma = new PrismaClient();
const actionRepo = new PrismaActionRepository(prisma);
const updateActionUC = new UpdateActionUseCase(actionRepo);
const deleteActionUC = new DeleteActionUseCase(actionRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository(prisma);
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const updateSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    isAvailable: z.boolean().optional(),
});

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

async function handleUseCase(req: NextRequest, actionId: string) {
    const authError = await requireDirector(req);
    if (authError) return authError;

    if (req.method === "DELETE") {
        const result = await deleteActionUC.execute({ actionId });
        if (!result.ok) {
            const e = result.error;
            if (e instanceof ActionNotFoundError) {
                return NextResponse.json({ code: "ACTION_NOT_FOUND" }, { status: 404 });
            }
            if (e instanceof ActionInUseError) {
                return NextResponse.json({ code: "ACTION_IN_USE" }, { status: 409 });
            }
            if (isDev) console.error("[admin actions delete] error:", e?.message);
            return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
        }
        return NextResponse.json({
            action: {
                ...result.value,
                createdAt: result.value.createdAt.toISOString(),
                updatedAt: result.value.updatedAt.toISOString(),
            },
        });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const result = await updateActionUC.execute({
        actionId,
        name: parsed.data.name,
        isAvailable: parsed.data.isAvailable,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ActionNotFoundError) {
            return NextResponse.json({ code: "ACTION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof InvalidActionInputError) {
            return NextResponse.json({ code: "INVALID_ACTION_INPUT" }, { status: 400 });
        }
        if (isDev) console.error("[admin actions update] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json({
        action: {
            ...result.value,
            createdAt: result.value.createdAt.toISOString(),
            updatedAt: result.value.updatedAt.toISOString(),
        },
    });
}

async function handleProxy(req: NextRequest, actionId: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/admin/actions/${actionId}`;

    try {
        const resp = await fetch(url, {
            method: req.method,
            headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie") ?? "",
            },
            body: req.method === "DELETE" ? undefined : await req.text(),
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[admin actions] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
    const actionId = context.params.id;
    return target === "next" ? handleUseCase(req, actionId) : handleProxy(req, actionId);
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const actionId = context.params.id;
    return target === "next" ? handleUseCase(req, actionId) : handleProxy(req, actionId);
}
