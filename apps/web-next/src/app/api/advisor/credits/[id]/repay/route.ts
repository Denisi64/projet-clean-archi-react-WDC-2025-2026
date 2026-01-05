export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { RepayCreditUseCase } from "@proj/application/credits/RepayCreditUseCase";
import { PrismaCreditRepository } from "@proj/infra/credits/PrismaCreditRepository";
import { CreditNotFoundError } from "@proj/domain/credits/errors/CreditNotFoundError";
import { CreditInactiveError } from "@proj/domain/credits/errors/CreditInactiveError";
import { InvalidCreditAmountError } from "@proj/domain/credits/errors/InvalidCreditAmountError";
import { InvalidCreditRepaymentError } from "@proj/domain/credits/errors/InvalidCreditRepaymentError";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const paramsSchema = z.object({ id: z.string().min(1) });

async function requireAdvisor(req: NextRequest): Promise<NextResponse | null> {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["ADVISOR", "DIRECTOR"] });
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
        if (isDev) console.error("[advisor repay] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return null;
}

async function handleUseCase(id: string) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor repay] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const uc = new RepayCreditUseCase(new PrismaCreditRepository());
    const result = await uc.execute(id);
    if (!result.ok) {
        const e = result.error;
        if (e instanceof CreditNotFoundError) {
            return NextResponse.json({ code: "CREDIT_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof CreditInactiveError) {
            return NextResponse.json({ code: "CREDIT_INACTIVE" }, { status: 409 });
        }
        if (e instanceof InvalidCreditAmountError) {
            return NextResponse.json({ code: "INVALID_CREDIT_AMOUNT" }, { status: 400 });
        }
        if (e instanceof InvalidCreditRepaymentError) {
            return NextResponse.json({ code: "INVALID_CREDIT_REPAYMENT" }, { status: 400 });
        }
        if (isDev) console.error("[advisor repay] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, credit: result.value });
}

async function handleProxy(req: NextRequest, id: string) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/advisor/credits/${id}/repay`;

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "x-advisor-token": req.headers.get("x-advisor-token") ?? "",
            },
        });
        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[advisor repay proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const authError = await requireAdvisor(req);
    if (authError) return authError;

    return target === "next" ? handleUseCase(parsedParams.data.id) : handleProxy(req, parsedParams.data.id);
}
