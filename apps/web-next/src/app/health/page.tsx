import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
    const t = await getTranslations("health");
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
                <h1>{t("title")}</h1>
                <p style={{ color: "red" }}>
                    {t("error", { status: String(res.status), statusText: res.statusText })}
                </p>
                <pre>{txt}</pre>
            </main>
        );
    }

    const data = await res.json();
    return (
        <main style={{ padding: 24 }}>
            <h1>{t("title")}</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </main>
    );
}
