export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TransferDiscussionUseCase } from "@proj/application/chat/TransferDiscussionUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { HttpChatEvents } from "@proj/infra/chat/HttpChatEvents";
import { requireChatRole } from "../../../../_auth";
import { DiscussionNotFound, ForbiddenDiscussionAccess } from "@proj/domain/chat/error/errors";

const target = process.env.BACKEND_TARGET ?? "nest";
const transferUC = new TransferDiscussionUseCase(createDiscussionRepository(), new HttpChatEvents());
const isDev = process.env.NODE_ENV !== "production";

const schema = z.object({
    toAdvisorId: z.string().trim().min(1),
});

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const raw = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    try {
        const updated = await transferUC.execute({
            discussionId: context.params.id,
            fromAdvisorId: auth.userId,
            toAdvisorId: parsed.data.toAdvisorId,
        });
        return NextResponse.json(updated);
    } catch (e: any) {
        if (e instanceof DiscussionNotFound) {
            return NextResponse.json({ code: "DISCUSSION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof ForbiddenDiscussionAccess) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (isDev) console.error("[chat transfer] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
