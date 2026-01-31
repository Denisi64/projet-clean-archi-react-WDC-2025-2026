export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GetAdvisorsUseCase } from "@proj/application/chat/GetAdvisorsUseCase";
import { createAdvisorRepository } from "@proj/infra";
import { requireChatRole } from "../_auth";

const target = process.env.BACKEND_TARGET ?? "nest";
const advisorsUC = new GetAdvisorsUseCase(createAdvisorRepository());

export async function GET(req: NextRequest) {
    if (target !== "next") {
        return NextResponse.json({ code: "NOT_SUPPORTED" }, { status: 501 });
    }

    const auth = await requireChatRole(req, ["ADVISOR"]);
    if (auth instanceof NextResponse) return auth;

    const advisors = await advisorsUC.execute();
    return NextResponse.json(advisors);
}
