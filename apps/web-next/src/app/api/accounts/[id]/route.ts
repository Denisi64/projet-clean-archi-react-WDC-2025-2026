export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PrismaAccountRepository } from "@/server/infrastructure/accounts/PrismaAccountRepository";
import { RenameAccountUseCase } from "@/server/application/accounts/RenameAccountUseCase";
import { AccountNotFoundError } from "@/server/domain/accounts/errors/AccountNotFoundError";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const renameAccountUC = new RenameAccountUseCase(accountRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const renameSchema = z.object({
    name: z.string().trim().min(2).max(80),
});

async function handleUseCase(req: NextRequest, accountId: string) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = renameSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }
    const { name } = parsed.data;

    try {
        const account = await renameAccountUC.execute({ accountId, userId, name });

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
        if (isDev) console.error("[accounts rename] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest, accountId: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/accounts/${accountId}`;

    try {
        const resp = await fetch(url, {
            method: "PATCH",
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
        if (isDev) console.error("[accounts-proxy PATCH] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return target === "next" ? handleUseCase(req, id) : handleProxy(req, id);
}
