export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SendPersonalNotificationUseCase } from "@proj/application/notifications/SendPersonalNotificationUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import {
    createNotificationRepository,
    createNotificationStream,
    createUserQueryRepository,
} from "@proj/infra";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";

const schema = z.object({
    userId: z.string().trim().min(1),
    title: z.string().trim().min(2),
    body: z.string().trim().max(1000).optional().nullable(),
});

const repo = createNotificationRepository();
const stream = createNotificationStream();
const sendNotificationUC = new SendPersonalNotificationUseCase(repo, stream);
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const isDev = process.env.NODE_ENV !== "production";

async function requireActor(req: NextRequest): Promise<{ userId: string; role: UserRole } | NextResponse> {
    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session });
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
        if (isDev) console.error("[personal notification] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return { userId: auth.value.userId, role: auth.value.role };
}

export async function POST(req: NextRequest) {
    const actor = await requireActor(req);
    if (actor instanceof NextResponse) return actor;

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const payload = parsed.data;
    const result = await sendNotificationUC.execute({
        actorRole: actor.role,
        userId: payload.userId,
        title: payload.title,
        body: payload.body ?? null,
    });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof ForbiddenRoleError) {
            return NextResponse.json(
                { code: "ROLE_NOT_ALLOWED", message: "Votre role ne permet pas cet envoi." },
                { status: 403 },
            );
        }
        if (isDev) console.error("[personal notification] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    return NextResponse.json(
        { id: result.value.notificationId, createdAt: result.value.createdAt.toISOString() },
        { status: 201 },
    );
}
