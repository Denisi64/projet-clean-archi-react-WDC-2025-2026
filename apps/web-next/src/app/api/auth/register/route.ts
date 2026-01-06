export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaAuthRepository } from "@proj/infra/auth/PrismaAuthRepository";
import { BcryptPasswordHasher } from "@proj/infra/auth/BcryptPasswordHasher";
import { RegisterUserUseCase } from "@proj/application/auth/RegisterUserUseCase";
import { EmailAlreadyInUseError } from "@proj/domain/auth/errors/EmailAlreadyInUseError";
import { NodemailerEmailService } from "@proj/infra/auth/NodemailerEmailService";
import { EmailDeliveryError } from "@proj/domain/auth/errors/EmailDeliveryError";
import { CryptoActivationTokenGenerator } from "@proj/infra/auth/CryptoActivationTokenGenerator";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const ttlHours = Number(process.env.CONFIRMATION_TOKEN_TTL_HOURS ?? "24");

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
});

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[register] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const { email, password, firstName, lastName } = parsed.data;

    const uc = new RegisterUserUseCase(
        new PrismaAuthRepository(undefined, { createDefaultAccount: true }),
        new BcryptPasswordHasher(),
        new NodemailerEmailService(),
        new CryptoActivationTokenGenerator(),
        ttlHours,
    );

    const name = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
    const result = await uc.execute({ email, password, name });
    if (!result.ok) {
        const err = result.error;
        if (err instanceof EmailAlreadyInUseError) {
            return NextResponse.json({ code: "EMAIL_ALREADY_USED" }, { status: 409 });
        }
        if (err instanceof EmailDeliveryError) {
            return NextResponse.json({ code: "EMAIL_DELIVERY_FAILED" }, { status: 502 });
        }
        if (isDev) console.error("Error in /api/auth/register:", err);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }

    const { expiresAt } = result.value;
    return NextResponse.json(
        { ok: true, confirmationExpiresAt: expiresAt.toISOString() },
        { status: 201 },
    );
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
