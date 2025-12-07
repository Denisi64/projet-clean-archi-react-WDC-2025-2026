export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { TransferBetweenAccountsUseCase } from "@/server/application/accounts/TransferBetweenAccountsUseCase";
import { PrismaTransferRepository } from "@/server/infrastructure/accounts/PrismaTransferRepository";
import { AccountNotFoundError } from "@/server/domain/accounts/errors/AccountNotFoundError";
import { AccountInactiveError } from "@/server/domain/accounts/errors/AccountInactiveError";
import { SameAccountTransferError } from "@/server/domain/accounts/errors/SameAccountTransferError";
import { InvalidTransferAmountError } from "@/server/domain/accounts/errors/InvalidTransferAmountError";
import { InsufficientFundsError } from "@/server/domain/accounts/errors/InsufficientFundsError";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";

const prisma = new PrismaClient();
const transferUC = new TransferBetweenAccountsUseCase(new PrismaTransferRepository(prisma));
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const transferSchema = z.object({
    sourceAccountId: z.string().min(1),
    destinationIban: z.string().trim().min(5),
    amount: z.union([z.string(), z.number()]).transform((v) => String(v)),
    note: z.string().max(255).optional(),
});

async function handleUseCase(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    try {
        const raw = await req.json().catch(() => null);
        const parsed = transferSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
        }

        const { sourceAccountId, destinationIban, amount, note } = parsed.data;

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
