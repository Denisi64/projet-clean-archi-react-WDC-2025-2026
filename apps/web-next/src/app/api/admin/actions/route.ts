export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createActionRepository, createUserQueryRepository } from "@proj/infra";
import { CreateActionUseCase } from "@proj/application/actions/CreateActionUseCase";
import { ListActionsUseCase } from "@proj/application/actions/ListActionsUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { ActionSymbolAlreadyExistsError } from "@proj/domain/actions/errors/ActionSymbolAlreadyExistsError";
import { InvalidActionInputError } from "@proj/domain/actions/errors/InvalidActionInputError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const actionRepo = createActionRepository();
const createActionUC = new CreateActionUseCase(actionRepo);
const listActionsUC = new ListActionsUseCase(actionRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const createSchema = z.object({
    symbol: z.string().trim().min(2).max(10),
    name: z.string().trim().min(2).max(120),
    price: z.string().regex(/^\d+(\.\d{1,4})?$/),
    availableStock: z.string().regex(/^\d+(\.\d{1,4})?$/),
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

async function handleUseCase(req: NextRequest) {
    const authError = await requireDirector(req);
    if (authError) return authError;

    if (req.method === "GET") {
        const result = await listActionsUC.execute({ includeUnavailable: true });
        if (!result.ok) {
            if (isDev) console.error("[admin actions] list error:", result.error?.message);
            return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
        }
        return NextResponse.json({
            actions: result.value.map((action) => ({
                ...action,
                createdAt: action.createdAt.toISOString(),
                updatedAt: action.updatedAt.toISOString(),
            })),
        });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const result = await createActionUC.execute({
        symbol: parsed.data.symbol,
        name: parsed.data.name,
        price: parsed.data.price,
        availableStock: parsed.data.availableStock,
        isAvailable: parsed.data.isAvailable ?? true,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ActionSymbolAlreadyExistsError) {
            return NextResponse.json({ code: "ACTION_SYMBOL_ALREADY_EXISTS" }, { status: 409 });
        }
        if (e instanceof InvalidActionInputError) {
            return NextResponse.json({ code: "INVALID_ACTION_INPUT" }, { status: 400 });
        }
        if (isDev) console.error("[admin actions] create error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json(
        {
            action: {
                ...result.value,
                createdAt: result.value.createdAt.toISOString(),
                updatedAt: result.value.updatedAt.toISOString(),
            },
        },
        { status: 201 },
    );
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/admin/actions`;

    try {
        const resp = await fetch(url, {
            method: req.method,
            headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie") ?? "",
            },
            body: req.method === "GET" ? undefined : await req.text(),
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

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
