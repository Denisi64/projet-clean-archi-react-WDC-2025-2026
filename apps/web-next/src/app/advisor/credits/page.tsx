import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdvisorCreditsClient from "./AdvisorCreditsClient";

type CurrentUser = { id: string; email: string; role: string | null };

async function loadCurrentUser(): Promise<CurrentUser | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    if (!cookieHeader) return null;

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/auth/me`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);

    if (!res || !res.ok) return null;
    const data = (await res.json()) as { user?: CurrentUser };
    if (!data.user) return null;
    return { ...data.user, role: data.user.role ?? null };
}

export default async function AdvisorCreditsPage() {
    const user = await loadCurrentUser();
    if (!user || (user.role !== "ADVISOR" && user.role !== "DIRECTOR")) {
        redirect("/");
    }

    return <AdvisorCreditsClient />;
}
