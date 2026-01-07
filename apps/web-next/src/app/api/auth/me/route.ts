export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { createAuthRepository } from "@proj/infra";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[auth/me] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const repo = createAuthRepository();
    const user = await repo.findById(userId);
    if (!user) return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });

    return NextResponse.json({
        ok: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            bannedAt: user.bannedAt ?? null,
        },
    });
}

async function handleProxy(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    if (!session) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/auth/me`;

    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
        });
        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[auth/me proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
