import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
    const hdrs = await headers();
    const proto = hdrs.get("x-forwarded-proto");
    const host = hdrs.get("x-forwarded-host") || hdrs.get("host");
    const base =
        (proto && host ? `${proto}://${host}` : undefined) ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000";

    const res = await fetch(`${base}/api/health`, { cache: "no-store" });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        return (
            <main style={{ padding: 24 }}>
                <h1>DB Health</h1>
                <p style={{ color: "red" }}>
                    Erreur: {res.status} {res.statusText}
                </p>
                <pre>{txt}</pre>
            </main>
        );
    }

    const data = await res.json();
    return (
        <main style={{ padding: 24 }}>
            <h1>DB Health</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </main>
    );
}
