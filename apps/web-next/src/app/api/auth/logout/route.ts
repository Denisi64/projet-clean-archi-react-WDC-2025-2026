import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return res;
}
