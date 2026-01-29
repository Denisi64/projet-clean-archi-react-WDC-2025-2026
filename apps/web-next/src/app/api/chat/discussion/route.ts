export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { CreateDiscussionUseCase } from "@proj/application/chat/CreateDiscussionUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { HttpChatEvents } from "@proj/infra/chat/HttpChatEvents";
import { requireChatRole } from "../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const createUC = new CreateDiscussionUseCase(createDiscussionRepository());
const events = new HttpChatEvents();

export async function POST(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["CLIENT"]);
    if (auth instanceof NextResponse) return auth;

    const discussion = await createUC.execute({ ownerId: auth.userId });
    await events.discussionCreated({
        discussionId: discussion.id,
        ownerId: auth.userId,
    });
    return NextResponse.json({ id: discussion.id }, { status: 201 });
}
