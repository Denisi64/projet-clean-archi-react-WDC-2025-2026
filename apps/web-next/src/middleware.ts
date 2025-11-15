import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const isAuth = req.cookies.get("session");
    if (req.nextUrl.pathname.startsWith("/login") && isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
}

export const config = { matcher: ["/login"] };
