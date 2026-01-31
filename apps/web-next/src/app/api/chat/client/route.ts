export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetClientDiscussionsUseCase } from "@proj/application/chat/GetClientDiscussionsUseCase";
import { createDiscussionRepository } from "@proj/infra";
import { requireChatRole } from "../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const clientUC = new GetClientDiscussionsUseCase(createDiscussionRepository());

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["CLIENT"]);
    if (auth instanceof NextResponse) return auth;

    const discussions = await clientUC.execute({ ownerId: auth.userId });
    return NextResponse.json(discussions);
}
