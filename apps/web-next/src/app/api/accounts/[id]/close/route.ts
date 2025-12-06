export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PrismaAccountRepository } from "@/server/infrastructure/accounts/PrismaAccountRepository";
import { CloseAccountUseCase } from "@/server/application/accounts/CloseAccountUseCase";
import { AccountNotFoundError } from "@/server/domain/accounts/errors/AccountNotFoundError";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const closeAccountUC = new CloseAccountUseCase(accountRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const closeParamsSchema = z.object({
    id: z.string().min(1),
});

async function handleUseCase(req: NextRequest, accountId: string) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    try {
        const account = await closeAccountUC.execute({ accountId, userId });

        return NextResponse.json({
            account: {
                ...account,
                createdAt: account.createdAt.toISOString(),
            },
        });
    } catch (e: any) {
        if (e instanceof AccountNotFoundError) {
            return NextResponse.json({ code: "ACCOUNT_NOT_FOUND" }, { status: 404 });
        }
        if (isDev) console.error("[accounts close] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest, accountId: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/accounts/${accountId}/close`;

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
        if (isDev) console.error("[accounts-proxy CLOSE] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const parsed = closeParamsSchema.safeParse(await params);
    if (!parsed.success) {
        return target === "next"
            ? NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 })
            : handleProxy(req, "");
    }
    const { id } = parsed.data;
    return target === "next" ? handleUseCase(req, id) : handleProxy(req, id);
}
