export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { SearchUsersUseCase } from "@/server/application/users/SearchUsersUseCase";
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
        if (isDev) console.error("[advisor users] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return null;
}

export async function GET(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[advisor users] DATABASE_URL missing");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const authError = await requireAdvisor(req);
    if (authError) return authError;

    const queryParam = req.nextUrl.searchParams.get("query") ?? "";
    const schema = z.string().optional();
    const parsed = schema.safeParse(queryParam);

    try {
        const uc = new SearchUsersUseCase(userRepo);
        const users = await uc.execute(parsed.success ? parsed.data ?? "" : "");
        return NextResponse.json({ users });
    } catch (e: any) {
        if (isDev) console.error("[advisor users] unexpected:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
