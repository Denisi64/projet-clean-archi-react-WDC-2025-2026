export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SendClientMessageUseCase } from "@proj/application/chat/SendClientMessageUseCase";
import { SendAdvisorMessageUseCase } from "@proj/application/chat/SendAdvisorMessageUseCase";
import { createDiscussionRepository, createMessageRepository } from "@proj/infra";
import { HttpChatEvents } from "@proj/infra/chat/HttpChatEvents";
import { requireChatRole } from "../../../_auth";
import {
    DiscussionNotFound,
    DiscussionClosed,
    ForbiddenDiscussionAccess,
} from "@proj/domain/chat/error/errors";

const target = process.env.BACKEND_TARGET ?? "nest";
const repo = createDiscussionRepository();
const messageRepo = createMessageRepository();
const events = new HttpChatEvents();
const sendClientUC = new SendClientMessageUseCase(repo, messageRepo, events);
const sendAdvisorUC = new SendAdvisorMessageUseCase(repo, messageRepo, events);
const isDev = process.env.NODE_ENV !== "production";

const schema = z.object({
    content: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["CLIENT", "ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const raw = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    try {
        const message =
            auth.role === "CLIENT"
                ? await sendClientUC.execute({
                      discussionId: context.params.id,
                      ownerId: auth.userId,
                      content: parsed.data.content,
                  })
                : await sendAdvisorUC.execute({
                      discussionId: context.params.id,
                      advisorId: auth.userId,
                      content: parsed.data.content,
                  });

        return NextResponse.json(message, { status: 201 });
    } catch (e: any) {
        if (e instanceof DiscussionNotFound) {
            return NextResponse.json({ code: "DISCUSSION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof ForbiddenDiscussionAccess) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (e instanceof DiscussionClosed) {
            return NextResponse.json({ code: "DISCUSSION_CLOSED" }, { status: 409 });
        }
        if (isDev) console.error("[chat message] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
