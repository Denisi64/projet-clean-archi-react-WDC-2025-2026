import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

type Credit = {
    id: string;
    status: string;
    monthlyDue: string;
    remainingPrincipal: string;
    remainingTermMonths: number;
};

export default async function CreditList() {
    const t = await getTranslations("creditList");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    if (!cookieHeader) return null;

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/credits/me`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);

    if (!res || !res.ok) return null;

    const data = (await res.json()) as { credits?: Credit[] };
    const credits = data.credits ?? [];
    if (credits.length === 0) return null;

    return (
        <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("title")}</div>
            <div style={{ color: "#555", marginBottom: 8 }}>{t("subtitle")}</div>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
                {credits.map((c) => (
                    <li key={c.id}>
                        {t("line", {
                            id: c.id,
                            status: c.status,
                            monthlyDue: c.monthlyDue,
                            remainingPrincipal: c.remainingPrincipal,
                            remainingTermMonths: c.remainingTermMonths,
                        })}
                    </li>
                ))}
            </ul>
        </div>
    );
}
