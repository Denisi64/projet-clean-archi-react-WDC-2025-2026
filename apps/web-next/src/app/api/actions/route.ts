export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createActionRepository } from "@proj/infra";
import { ListActionsUseCase } from "@proj/application/actions/ListActionsUseCase";

const actionRepo = createActionRepository();
const listActionsUC = new ListActionsUseCase(actionRepo);
const target = process.env.BACKEND_TARGET ?? "nest";
const isDev = process.env.NODE_ENV !== "production";

async function handleUseCase() {
    const result = await listActionsUC.execute({ includeUnavailable: true });
    if (!result.ok) {
        if (isDev) console.error("[actions] list error:", result.error?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
    return NextResponse.json({
        actions: result.value.map((action) => ({
            ...action,
            createdAt: action.createdAt.toISOString(),
            updatedAt: action.updatedAt.toISOString(),
        })),
    });
}

async function handleProxy(req: NextRequest) {
    const base = (process.env.NEST_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
    const url = `${base}/actions`;

    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: { cookie: req.headers.get("cookie") ?? "" },
        });

        const data = await resp.text();
        const out = new NextResponse(data || null, { status: resp.status });
        out.headers.set("content-type", resp.headers.get("content-type") ?? "application/json");
        return out;
    } catch (e: any) {
        if (isDev) console.error("[actions GET] upstream error:", e?.message);
        return NextResponse.json({ code: "UPSTREAM_UNREACHABLE" }, { status: 502 });
    }
}

export async function GET(req: NextRequest) {
    return target === "next" ? handleUseCase() : handleProxy(req);
}
