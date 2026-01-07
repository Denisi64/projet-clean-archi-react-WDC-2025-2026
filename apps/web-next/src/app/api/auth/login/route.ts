export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createAuthRepository } from "@proj/infra";
import { BcryptPasswordHasher } from "@proj/infra/auth/BcryptPasswordHasher";
import { JwtTokenManager } from "@proj/infra/auth/JwtTokenManager";
import { LoginUserUseCase } from "@proj/application/auth/LoginUserUseCase";
import { InvalidCredentialsError } from "@proj/domain/auth/errors/InvalidCredentialsError";
import { InactiveAccountError } from "@proj/domain/auth/errors/InactiveAccountError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    remember: z.boolean().optional(),
});

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[login] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const { email, password, remember } = parsed.data;

    const uc = new LoginUserUseCase(
        createAuthRepository(),
        new BcryptPasswordHasher(),
        new JwtTokenManager(process.env.JWT_SECRET ?? "dev-secret"),
    );

    const result = await uc.execute({ email, password, remember });
    if (!result.ok) {
        const e = result.error;
        if (e instanceof InvalidCredentialsError) {
            return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
        }
        if (e instanceof InactiveAccountError) {
            return NextResponse.json({ code: "ACCOUNT_INACTIVE" }, { status: 403 });
        }
        if (e instanceof BannedAccountError) {
            return NextResponse.json({ code: "ACCOUNT_BANNED" }, { status: 403 });
        }
        if (isDev) console.error("[login] Unexpected:", e?.name, e?.message);
        return NextResponse.json(
            { code: "UNEXPECTED_ERROR", ...(isDev ? { name: e?.name, message: e?.message } : {}) },
            { status: 500 },
        );
    }

    const { token, ttl } = result.value;
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: ttl, // seconds
    });
    return res;
}

async function handleProxy(req: NextRequest) {
    const body = await req.text();
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/auth/login`;

    if (isDev) console.log("[login-proxy] →", url);

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        const setCookie = resp.headers.get("set-cookie");
        if (setCookie) out.headers.set("set-cookie", setCookie);
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[login-proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
