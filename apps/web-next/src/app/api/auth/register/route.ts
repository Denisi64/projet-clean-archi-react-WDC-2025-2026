export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PrismaAuthRepository } from "@/server/infrastructure/auth/PrismaAuthRepository";
import { BCryptPasswordHasher } from "@/server/infrastructure/auth/BCryptPasswordHasher";
import { RegisterUserUseCase } from "@/server/application/auth/RegisterUserUseCase";
import { EmailAlreadyInUseError } from "@/server/domain/auth/errors/EmailAlreadyInUseError";
import { NodemailerEmailService } from "@/server/infrastructure/auth/NodemailerEmailService";
import { EmailDeliveryError } from "@/server/domain/auth/errors/EmailDeliveryError";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const ttlHours = Number(process.env.CONFIRMATION_TOKEN_TTL_HOURS ?? "24");

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[register] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const body = await req.json();
    const { email, password, firstName, lastName } = body ?? {};

    if (!email || !password) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    try {
        const uc = new RegisterUserUseCase(
            new PrismaAuthRepository(),
            new BCryptPasswordHasher(),
            new NodemailerEmailService(),
            ttlHours,
        );

        const name = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
        const { expiresAt } = await uc.execute({ email, password, name });
        return NextResponse.json(
            { ok: true, confirmationExpiresAt: expiresAt.toISOString() },
            { status: 201 },
        );
    } catch (err: any) {
        if (err instanceof EmailAlreadyInUseError) {
            return NextResponse.json({ code: "EMAIL_ALREADY_USED" }, { status: 409 });
        }
        if (err instanceof EmailDeliveryError) {
            return NextResponse.json({ code: "EMAIL_DELIVERY_FAILED" }, { status: 502 });
        }
        if (isDev) console.error("Error in /api/auth/register:", err);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}

async function handleProxy(req: NextRequest) {
    const body = await req.text();
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/auth/register`;

    if (isDev) console.log("[register-proxy] →", url);

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
        if (isDev) console.error("[register-proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function POST(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
