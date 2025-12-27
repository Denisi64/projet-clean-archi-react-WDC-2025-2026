export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient, AccountType } from "@prisma/client";
import { PrismaAccountRepository } from "@/server/infrastructure/accounts/PrismaAccountRepository";
import { CreateAccountForUserUseCase } from "@/server/application/accounts/CreateAccountForUserUseCase";
import { GetUserAccountsUseCase } from "@/server/application/accounts/GetUserAccountsUseCase";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@/server/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@/server/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@/server/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@/server/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const prisma = new PrismaClient();
const accountRepo = new PrismaAccountRepository(prisma);
const createAccountUC = new CreateAccountForUserUseCase(accountRepo);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository(prisma);
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const createSchema = z.object({
    userId: z.string().min(1),
    name: z.string().trim().min(2).max(80).optional(),
    type: z.enum(["CURRENT", "SAVINGS"]).optional(),
});

async function requireDirector(req: NextRequest): Promise<NextResponse | null> {
    const session = req.cookies.get("session")?.value ?? null;
    try {
        await getUserRoleUC.execute({ token: session, requiredRoles: ["DIRECTOR"] });
    } catch (e: any) {
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
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[admin accounts] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const authError = await requireDirector(req);
    if (authError) return authError;

    if (req.method === "GET") {
        const userId = req.nextUrl.searchParams.get("userId") ?? "";
        if (!userId) return NextResponse.json({ accounts: [] });
        const listUC = new GetUserAccountsUseCase(accountRepo);
        const accounts = await listUC.execute(userId);
        return NextResponse.json({
            accounts: accounts.map((acc) => ({
                ...acc,
                createdAt: acc.createdAt.toISOString(),
            })),
        });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const account = await createAccountUC.execute({
        userId: parsed.data.userId,
        name: parsed.data.name,
        type: (parsed.data.type ?? "CURRENT") as AccountType,
    });

    return NextResponse.json(
        { account: { ...account, createdAt: account.createdAt.toISOString() } },
        { status: 201 },
    );
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/admin/accounts`;

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
        if (isDev) console.error("[admin accounts POST] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}

export async function GET(req: NextRequest) {
    if (target === "next") return handleUseCase(req);
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = new URL(`${base}/admin/accounts`);
    const userId = req.nextUrl.searchParams.get("userId");
    if (userId) url.searchParams.set("userId", userId);

    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[admin accounts GET] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}
