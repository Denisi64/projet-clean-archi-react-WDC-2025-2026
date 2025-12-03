export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { PrismaAccountRepository } from "../../../../../../api-nest/src/infrastructure/repositories/PrismaAccountRepository";
import { RenameAccountUseCase } from "../../../../../../api-nest/src/application/accounts/RenameAccountUseCase";
import { AccountNotFoundError } from "../../../../../../api-nest/src/domain/accounts/errors/AccountNotFoundError";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const renameAccountUC = new RenameAccountUseCase(accountRepo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

function getUserIdFromSession(req: NextRequest): string | null {
    const session = req.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const payload = jwt.verify(session, process.env.JWT_SECRET ?? "dev-secret") as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[accounts rename] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest, accountId: string) {
    const userId = getUserIdFromSession(req);
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ code: "INVALID_NAME" }, { status: 400 });
    }

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    return target === "next" ? handleUseCase(req, params.id) : handleProxy(req, params.id);
}
