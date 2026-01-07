export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    createActionRepository,
    createActionTradeRepository,
    createPortfolioRepository,
    createUserQueryRepository,
} from "@proj/infra";
import { LocalSocketActionStockNotifier } from "@proj/infra/notifications/LocalSocketActionStockNotifier";
import { SellActionUseCase } from "@proj/application/actions/SellActionUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { ActionNotFoundError } from "@proj/domain/actions/errors/ActionNotFoundError";
import { InsufficientActionQuantityError } from "@proj/domain/actions/errors/InsufficientActionQuantityError";
import { InvalidActionQuantityError } from "@proj/domain/actions/errors/InvalidActionQuantityError";

const actionRepo = createActionRepository();
const portfolioRepo = createPortfolioRepository();
const tradeRepo = createActionTradeRepository();
const notifier = new LocalSocketActionStockNotifier();
const sellActionUC = new SellActionUseCase(actionRepo, portfolioRepo, tradeRepo, notifier);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const schema = z.object({
    quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
});

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
        if (isDev) console.error("[actions sell] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId };
}

async function handleUseCase(req: NextRequest, actionId: string) {
    const auth = await requireClient(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const result = await sellActionUC.execute({
        userId: auth.userId,
        actionId,
        quantity: parsed.data.quantity,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ActionNotFoundError) {
            return NextResponse.json({ code: "ACTION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof InsufficientActionQuantityError) {
            return NextResponse.json({ code: "INSUFFICIENT_ACTION_QUANTITY" }, { status: 409 });
        }
        if (e instanceof InvalidActionQuantityError) {
            return NextResponse.json({ code: "INVALID_ACTION_QUANTITY" }, { status: 400 });
        }
        if (isDev) console.error("[actions sell] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ actionId: result.value.actionId, quantity: result.value.quantity });
}

async function handleProxy(req: NextRequest, actionId: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/actions/${actionId}/sell`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: req.headers.get("cookie") ?? "",
            },
            body: await req.text(),
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[actions sell] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    const actionId = context.params.id;
    return target === "next" ? handleUseCase(req, actionId) : handleProxy(req, actionId);
}
