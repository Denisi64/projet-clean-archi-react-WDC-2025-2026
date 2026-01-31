import { NextRequest, NextResponse } from "next/server";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { createUserQueryRepository } from "@proj/infra";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const isDev = process.env.NODE_ENV !== "production";

export type ChatAuth = { userId: string; role: "CLIENT" | "ADVISOR" | "DIRECTOR" };

export async function requireChatRole(
    req: NextRequest,
    roles: ChatAuth["role"][],
): Promise<ChatAuth | NextResponse> {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: roles });
    if (!auth.ok) {
        const e = auth.error;
        if (e instanceof UnauthorizedAccessError) {
            return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
        }
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json({ code: "ROLE_NOT_ALLOWED" }, { status: 403 });
        }
        if (e instanceof BannedAccountError) {
            return NextResponse.json({ code: "ACCOUNT_BANNED" }, { status: 403 });
        }
        if (isDev) console.error("[chat] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId, role: auth.value.role };
}
