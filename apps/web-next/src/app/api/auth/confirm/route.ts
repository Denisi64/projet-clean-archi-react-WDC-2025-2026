export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ConfirmUserUseCase } from "@/server/application/auth/ConfirmUserUseCase";
import { PrismaAuthRepository } from "@/server/infrastructure/auth/PrismaAuthRepository";
import { InvalidConfirmationTokenError } from "@/server/domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError } from "@/server/domain/auth/errors/ExpiredConfirmationTokenError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[confirm] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const { token } = (await req.json()) ?? {};
    if (!token) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    try {
        const uc = new ConfirmUserUseCase(new PrismaAuthRepository());
        await uc.execute(token);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err instanceof InvalidConfirmationTokenError) {
            return NextResponse.json({ code: "CONFIRMATION_TOKEN_INVALID" }, { status: 400 });
        }
        if (err instanceof ExpiredConfirmationTokenError) {
            return NextResponse.json({ code: "CONFIRMATION_TOKEN_EXPIRED" }, { status: 410 });
        }
        if (isDev) console.error("Error in /api/auth/confirm:", err);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest) {
    const body = await req.text();
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/auth/confirm`;

    if (isDev) console.log("[confirm-proxy] →", url);

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
        });
        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[confirm-proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
