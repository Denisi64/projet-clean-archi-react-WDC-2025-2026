export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { createCreditRepository } from "@proj/infra";
import { ListCreditsForUserUseCase } from "@proj/application/credits/ListCreditsForUserUseCase";

const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";
const tokenVerifier = new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret");

async function handleUseCase(req: NextRequest) {
    if (!process.env.DATABASE_URL) {
        if (isDev) console.error("[credits/me] DATABASE_URL missing (BACKEND_TARGET=next)");
        return NextResponse.json({ code: "DB_URL_MISSING" }, { status: 500 });
    }

    const session = req.cookies.get("session")?.value;
    const userId = session ? await tokenVerifier.verify(session) : null;
    if (!userId) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const uc = new ListCreditsForUserUseCase(createCreditRepository());
    const result = await uc.execute(userId);
    if (!result.ok) {
        if (isDev) console.error("[credits/me] unexpected:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, credits: result.value });
}

async function handleProxy(req: NextRequest) {
    const session = req.cookies.get("session")?.value;
    if (!session) {
        return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/credits/me`;

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
        if (isDev) console.error("[credits/me proxy] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase(req) : handleProxy(req);
}
