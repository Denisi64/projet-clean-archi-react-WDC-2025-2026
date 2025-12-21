export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { JwtTokenVerifier } from "@/server/infrastructure/auth/JwtTokenVerifier";
import { PrismaSavingsRateRepository } from "@/server/infrastructure/accounts/PrismaSavingsRateRepository";
import { GetActiveSavingsRateUseCase } from "@/server/application/accounts/GetActiveSavingsRateUseCase";
import { UpdateSavingsRateUseCase } from "@/server/application/accounts/UpdateSavingsRateUseCase";

const prisma = new PrismaClient();
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const rateRepo = new PrismaSavingsRateRepository(prisma);
const getRateUC = new GetActiveSavingsRateUseCase(rateRepo);
const updateRateUC = new UpdateSavingsRateUseCase(rateRepo);

const bodySchema = z.object({
    ratePercent: z.number().min(0.01).max(50),
});

async function getCurrentRole(userId: string): Promise<"CLIENT" | "ADVISOR" | "DIRECTOR" | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return user?.role ?? null;
}

export async function GET(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const role = await getCurrentRole(userId);
    if (role !== "DIRECTOR") {
        return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    const current = await getRateUC.execute();
    const ratePercent = current !== null ? Math.round(current * 10000) / 100 : null;

    return NextResponse.json({ ratePercent });
}

export async function POST(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const role = await getCurrentRole(userId);
    if (role !== "DIRECTOR") {
        return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const rate = parsed.data.ratePercent / 100;
    const result = await updateRateUC.execute({ actorRole: role, rate });
    if (!result.ok) {
        const status = result.code === "FORBIDDEN" ? 403 : 400;
        return NextResponse.json({ code: result.code }, { status });
    }

    return NextResponse.json({ ok: true, ratePercent: parsed.data.ratePercent });
}
