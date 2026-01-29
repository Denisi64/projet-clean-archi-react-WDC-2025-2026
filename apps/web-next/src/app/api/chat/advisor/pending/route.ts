export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetPendingDiscussionsUseCase } from "@proj/application/chat/GetPendingDiscussionsUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { requireChatRole } from "../../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const pendingUC = new GetPendingDiscussionsUseCase(createDiscussionRepository());

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const discussions = await pendingUC.execute();
    return NextResponse.json(discussions);
}
