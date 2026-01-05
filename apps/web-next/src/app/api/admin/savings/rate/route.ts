export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@/server/infrastructure/users/PrismaUserQueryRepository";
import { PrismaSavingsRateRepository } from "@/server/infrastructure/accounts/PrismaSavingsRateRepository";
import { GetActiveSavingsRateUseCase } from "@proj/application/accounts/GetActiveSavingsRateUseCase";
import { UpdateSavingsRateUseCase } from "@proj/application/accounts/UpdateSavingsRateUseCase";
import { LocalSocketSavingsRateNotifier } from "@/server/infrastructure/notifications/LocalSocketSavingsRateNotifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const prisma = new PrismaClient();
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const rateRepo = new PrismaSavingsRateRepository(prisma);
const notifier = new LocalSocketSavingsRateNotifier(prisma);
const userRepo = new PrismaUserQueryRepository(prisma);
const getRateUC = new GetActiveSavingsRateUseCase(rateRepo);
const updateRateUC = new UpdateSavingsRateUseCase(rateRepo, notifier);
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);

const bodySchema = z.object({
    ratePercent: z.number().min(0.01).max(50),
});

export async function GET(req: NextRequest) {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["DIRECTOR"] });
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
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const rateResult = await getRateUC.execute();
    if (!rateResult.ok) {
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    const current = rateResult.value;
    const ratePercent = current !== null ? Math.round(current * 10000) / 100 : null;

    return NextResponse.json({ ratePercent });
}

export async function POST(req: NextRequest) {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["DIRECTOR"] });
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
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const rate = parsed.data.ratePercent / 100;
    const result = await updateRateUC.execute({ actorRole: "DIRECTOR", rate });
    if (!result.ok) {
        const status = result.error === "FORBIDDEN" ? 403 : 400;
        return NextResponse.json({ code: result.error }, { status });
    }

    return NextResponse.json({ ok: true, ratePercent: parsed.data.ratePercent });
}
