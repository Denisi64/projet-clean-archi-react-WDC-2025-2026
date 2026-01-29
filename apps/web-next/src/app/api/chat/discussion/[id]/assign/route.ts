export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { AssignDiscussionUseCase } from "@proj/application/chat/AssignDiscussionUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { HttpChatEvents } from "@proj/infra/chat/HttpChatEvents";
import { requireChatRole } from "../../../../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const assignUC = new AssignDiscussionUseCase(createDiscussionRepository(), new HttpChatEvents());
const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    try {
        await assignUC.execute({ discussionId: context.params.id, advisorId: auth.userId });
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        if (isDev) console.error("[chat assign] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
