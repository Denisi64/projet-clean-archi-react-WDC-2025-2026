export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetAdvisorDiscussionsUseCase } from "@proj/application/chat/GetAdvisorDiscussionsUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { requireChatRole } from "../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const advisorUC = new GetAdvisorDiscussionsUseCase(createDiscussionRepository());

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const discussions = await advisorUC.execute({ advisorId: auth.userId });
    return NextResponse.json(discussions);
}
