export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetDiscussionMessagesUseCase } from "@proj/application/chat/GetDiscussionMessagesUseCase";
import { createDiscussionRepository, createMessageRepository } from "@proj/infra";
import { requireChatRole } from "../../../_auth";
import { DiscussionNotFound, ForbiddenDiscussionAccess } from "@proj/domain/chat/error/errors";

const target = process.env.BACKEND_TARGET ?? "nest";
const getMessagesUC = new GetDiscussionMessagesUseCase(
    createDiscussionRepository(),
    createMessageRepository(),
);
const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const params = await context.params;
    const auth = await requireChatRole(req, ["CLIENT", "ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    try {
        const messages = await getMessagesUC.execute({
            discussionId: params.id,
            userId: auth.userId,
            role: auth.role,
        });
        return NextResponse.json(messages);
    } catch (e: any) {
        if (e instanceof DiscussionNotFound) {
            return NextResponse.json({ code: "DISCUSSION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof ForbiddenDiscussionAccess) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (isDev) console.error("[chat messages] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
