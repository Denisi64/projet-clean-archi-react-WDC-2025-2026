export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { GrantCreditUseCase } from "@/server/application/credits/GrantCreditUseCase";
import { PrismaCreditRepository } from "@/server/infrastructure/credits/PrismaCreditRepository";
import { ListCreditsForUserUseCase } from "@/server/application/credits/ListCreditsForUserUseCase";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { GetUserRoleFromTokenUseCase } from "@/server/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@/server/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@/server/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@/server/domain/auth/errors/BannedAccountError";

const isDev = process.env.NODE_ENV !== "production";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = new PrismaUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

async function requireAdvisor(req: NextRequest): Promise<NextResponse | null> {
    const session = req.cookies.get("session")?.value ?? null;
    try {
        await getUserRoleUC.execute({ token: session, requiredRoles: ["ADVISOR", "DIRECTOR"] });
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

    try {
        const uc = new GrantCreditUseCase(new PrismaCreditRepository());
        const credit = await uc.execute(parsed.data);
        return NextResponse.json({ ok: true, credit }, { status: 201 });
    } catch (e: any) {
        if (isDev) console.error("[advisor credits] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
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

    try {
        const uc = new ListCreditsForUserUseCase(new PrismaCreditRepository());
        const credits = await uc.execute(userId);
        return NextResponse.json({ ok: true, credits });
    } catch (e: any) {
        if (isDev) console.error("[advisor credits list] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
