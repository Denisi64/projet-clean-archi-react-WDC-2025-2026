export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetDiscussionUseCase } from "@proj/application/chat/GetDiscussionUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { requireChatRole } from "../../_auth";
import { DiscussionNotFound, ForbiddenDiscussionAccess } from "@proj/domain/chat/error/errors";

const target = process.env.BACKEND_TARGET ?? "nest";
const getUC = new GetDiscussionUseCase(createDiscussionRepository());
const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const params = await context.params;
    const auth = await requireChatRole(req, ["CLIENT", "ADVISOR"]);
    if (auth instanceof NextResponse) return auth;


    try {
        const discussion = await getUC.execute({
            discussionId: params.id,
            userId: auth.userId,
            role: auth.role,
        });
        return NextResponse.json(discussion);
    } catch (e: any) {
        if (e instanceof DiscussionNotFound) {
            return NextResponse.json({ code: "DISCUSSION_NOT_FOUND" }, { status: 404 });
        }
        if (e instanceof ForbiddenDiscussionAccess) {
            return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
        }
        if (isDev) console.error("[chat discussion] error:", e?.message);
        return NextResponse.json({ code: "UNEXPECTED_ERROR" }, { status: 500 });
    }
}
