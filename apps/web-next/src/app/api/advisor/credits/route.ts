export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GrantCreditUseCase } from "@proj/application/credits/GrantCreditUseCase";
import { ListCreditsForUserUseCase } from "@proj/application/credits/ListCreditsForUserUseCase";
import { createCreditRepository, createUserQueryRepository } from "@proj/infra";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { InvalidCreditInputError } from "@proj/domain/credits/errors/InvalidCreditInputError";
import { InvalidCreditTermError } from "@proj/domain/credits/errors/InvalidCreditTermError";

const isDev = process.env.NODE_ENV !== "production";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

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
        if (isDev) console.error("[advisor credits] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return null;
}

const postSchema = z.object({
    userId: z.string().min(1),
    principal: z.number().positive(),
    annualRate: z.number().positive(),
    insuranceRate: z.number().min(0),
    termMonths: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor credits] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const authError = await requireAdvisor(req);
    if (authError) return authError;

    const raw = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const uc = new GrantCreditUseCase(createCreditRepository());
    const result = await uc.execute(parsed.data);
    if (!result.ok) {
        const e = result.error;
        if (e instanceof InvalidCreditInputError) {
            return NextResponse.json({ code: "INVALID_CREDIT_INPUT" }, { status: 400 });
        }
        if (e instanceof InvalidCreditTermError) {
            return NextResponse.json({ code: "INVALID_CREDIT_TERM" }, { status: 400 });
        }
        if (isDev) console.error("[advisor credits] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, credit: result.value }, { status: 201 });
}

export async function GET(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor credits list] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const authError = await requireAdvisor(req);
    if (authError) return authError;

    const userId = req.nextUrl.searchParams.get("userId") ?? "";
    if (!userId) {
        return NextResponse.json({ credits: [] });
    }

    const uc = new ListCreditsForUserUseCase(createCreditRepository());
    const result = await uc.execute(userId);
    if (!result.ok) {
        if (isDev) console.error("[advisor credits list] unexpected:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, credits: result.value });
}
