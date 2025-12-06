export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient, AccountType } from "@prisma/client";
import { PrismaAccountRepository } from "../../../../../api-nest/src/infrastructure/repositories/PrismaAccountRepository";
import { CreateAccountForUserUseCase } from "../../../../../api-nest/src/application/accounts/CreateAccountForUserUseCase";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const createAccountUC = new CreateAccountForUserUseCase(accountRepo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

function getUserIdFromSession(req: NextRequest): string | null {
    const session = req.cookies.get("session")?.value;
    if (!session) return null;
    try {
        const payload = jwt.verify(session, process.env.JWT_SECRET ?? "dev-secret") as any;
        return typeof payload?.sub === "string" ? payload.sub : null;
    } catch (e: any) {
        if (isDev) console.warn("[accounts create] invalid session:", e?.message);
        return null;
    }
}

async function handleUseCase(req: NextRequest) {
    const userId = getUserIdFromSession(req);
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawName = typeof body?.name === "string" ? body.name : undefined;
    const type = body?.type === "SAVINGS" ? "SAVINGS" : "CURRENT";

    const account = await createAccountUC.execute({
        userId,
        name: rawName,
        type: type as AccountType,
    });

    return NextResponse.json(
        {
            account: {
                ...account,
                createdAt: account.createdAt.toISOString(),
            },
        },
        { status: 201 },
    );
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/accounts`;

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
        if (isDev) console.error("[accounts-proxy POST] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
