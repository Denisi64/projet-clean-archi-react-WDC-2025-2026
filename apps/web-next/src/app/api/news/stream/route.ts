export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { GetUserRoleFromTokenUseCase } from "@proj/application/auth/GetUserRoleFromTokenUseCase";
import { createNewsRepository, createUserQueryRepository } from "@proj/infra";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { ListNewsUseCase } from "@proj/application/news/ListNewsUseCase";

const target = process.env.BACKEND_TARGET ?? "nest";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");
const userRepo = createUserQueryRepository();
const getUserRoleUC = new GetUserRoleFromTokenUseCase(tokenVerifier, userRepo);
const newsRepo = createNewsRepository();
const listNewsUC = new ListNewsUseCase(newsRepo);
const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const session = req.cookies.get("session")?.value ?? null;
    const auth = await getUserRoleUC.execute({ token: session, requiredRoles: ["CLIENT"] });
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
        if (isDev) console.error("[news stream] auth error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const streamBody = new TransformStream();
    const writer = streamBody.writable.getWriter();

    const sendEvent = async (event: string, data: unknown) => {
        await writer.write(encoder.encode(`event: ${event}\n`));
        await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    const initialWindowMs = 10 * 60 * 1000;
    let lastSeen = new Date(Date.now() - initialWindowMs);

    const poll = async () => {
        const result = await listNewsUC.execute({ since: lastSeen, limit: 50 });
        if (!result.ok) return;
        const list = result.value.news;
        const ordered = [...list].reverse();
        for (const item of ordered) {
            void sendEvent("news", item);
        }
        if (list.length > 0) {
            const newest = list[0];
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
