export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AccountType } from "@prisma/client";
import { z } from "zod";
import { PrismaAccountRepository } from "@/server/infrastructure/accounts/PrismaAccountRepository";
import { CreateAccountForUserUseCase } from "@/server/application/accounts/CreateAccountForUserUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const createAccountUC = new CreateAccountForUserUseCase(accountRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const createSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    type: z.enum(["CURRENT", "SAVINGS"]).optional(),
});

async function handleUseCase(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const rawName = parsed.data.name;
    const type = parsed.data.type ?? "CURRENT";

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
