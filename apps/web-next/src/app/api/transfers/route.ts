export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { TransferBetweenAccountsUseCase } from "../../../../../api-nest/src/application/accounts/TransferBetweenAccountsUseCase";
import { PrismaTransferRepository } from "../../../../../api-nest/src/infrastructure/repositories/PrismaTransferRepository";
import { AccountNotFoundError } from "../../../../../api-nest/src/domain/accounts/errors/AccountNotFoundError";
import { AccountInactiveError } from "../../../../../api-nest/src/domain/accounts/errors/AccountInactiveError";
import { SameAccountTransferError } from "../../../../../api-nest/src/domain/accounts/errors/SameAccountTransferError";
import { InvalidTransferAmountError } from "../../../../../api-nest/src/domain/accounts/errors/InvalidTransferAmountError";
import { InsufficientFundsError } from "../../../../../api-nest/src/domain/accounts/errors/InsufficientFundsError";

const prisma = new PrismaClient();
const transferUC = new TransferBetweenAccountsUseCase(new PrismaTransferRepository(prisma));
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

function getUserIdFromSession(req: NextRequest): string | null {
    const session = req.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const payload = jwt.verify(session, process.env.JWT_SECRET ?? "dev-secret") as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[transfer] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest) {
    const userId = getUserIdFromSession(req);
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const sourceAccountId = typeof body?.sourceAccountId === "string" ? body.sourceAccountId.trim() : "";
        const destinationIban = typeof body?.destinationIban === "string" ? body.destinationIban.trim() : "";
        const amount = typeof body?.amount === "number" || typeof body?.amount === "string" ? String(body.amount) : "";
        const note = typeof body?.note === "string" ? body.note : undefined;

        const result = await transferUC.execute({
            userId,
            sourceAccountId,
            destinationIban,
            amount,
            note,
        });

        return NextResponse.json(result, { status: 201 });
    } catch (e: any) {
        if (e instanceof AccountNotFoundError) {
            return NextResponse.json({ code: "ACCOUNT_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof AccountInactiveError) {
            return NextResponse.json({ code: "ACCOUNT_INACTIVE" }, { status: 409 });
        }
        if (e instanceof SameAccountTransferError) {
            return NextResponse.json({ code: "SAME_ACCOUNT_TRANSFER" }, { status: 400 });
        }
        if (e instanceof InvalidTransferAmountError) {
            return NextResponse.json({ code: "INVALID_TRANSFER_AMOUNT" }, { status: 400 });
        }
        if (e instanceof InsufficientFundsError) {
            return NextResponse.json({ code: "INSUFFICIENT_FUNDS" }, { status: 409 });
        }
        if (isDev) console.error("[transfer] unexpected", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/transfers`;

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
        if (isDev) console.error("[transfer-proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
