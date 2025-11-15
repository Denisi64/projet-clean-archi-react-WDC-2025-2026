import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
    const token = randomBytes(16).toString("hex");
    const res = NextResponse.json({ ok: true });
    res.cookies.set("csrf", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "lax",
        path: "/",
        maxAge: 900,
    });
    return res;
}