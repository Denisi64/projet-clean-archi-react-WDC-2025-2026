export const API_BASE =
    process.env.NEXT_PUBLIC_NEST_API_URL ??
    process.env.NEST_API_URL ??
    "http://localhost:3001";

export async function apiGet<T = unknown>(path: string, init?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        ...(init ?? {}),
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return (await res.json()) as T;
}
