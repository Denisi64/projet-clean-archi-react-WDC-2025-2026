export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { createNotificationRepository, createUserQueryRepository } from "@proj/infra";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { ListNotificationsForUserUseCase } from "@proj/application/notifications/ListNotificationsForUserUseCase";

const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const notificationRepo = createNotificationRepository();
const listNotificationsUC = new ListNotificationsForUserUseCase(notificationRepo);
const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
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
        if (isDev) console.error("[notifications stream] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const userId = auth.value.userId;

    const encoder = new TextEncoder();
    const streamBody = new TransformStream();
    const writer = streamBody.writable.getWriter();

    const sendEvent = async (event: string, data: unknown) => {
        await writer.write(encoder.encode(`event: ${event}\n`));
        await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    const initialWindowMs = 5 * 60 * 1000;
    let lastSeen = new Date(Date.now() - initialWindowMs);

    const poll = async () => {
        const result = await listNotificationsUC.execute({ userId, since: lastSeen, limit: 50 });
        if (!result.ok) return;
        const list = result.value.notifications;
        for (const item of list) {
            void sendEvent("notification", item);
        }
        if (list.length > 0) {
            const newest = list[list.length - 1];
            lastSeen = new Date(newest.createdAt);
        }
    };

    const interval = setInterval(() => {
        void poll();
    }, 2000);

    const heartbeat = setInterval(() => {
        void writer.write(encoder.encode(": keep-alive\n\n"));
    }, 20000);

    const close = () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        writer.close().catch(() => {});
    };

    req.signal.addEventListener("abort", close, { once: true });
    void sendEvent("ready", { ok: true });
    void poll();

    return new Response(streamBody.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
