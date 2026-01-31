export type AuthMe = {
  id: string;
  role: "CLIENT" | "ADVISOR" | "DIRECTOR";
};

export async function getAuthMe(): Promise<AuthMe | null> {
    const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.user ?? null;
}
