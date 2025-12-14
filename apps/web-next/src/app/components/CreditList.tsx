import { cookies } from "next/headers";

type Credit = {
    id: string;
    status: string;
    monthlyDue: string;
    remainingPrincipal: string;
    remainingTermMonths: number;
};

export default async function CreditList() {
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
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Mes crédits</div>
            <div style={{ color: "#555", marginBottom: 8 }}>Crédits en cours (max 5)</div>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
                {credits.map((c) => (
                    <li key={c.id}>
                        #{c.id} — {c.status} — {c.monthlyDue} EUR/mois — restant {c.remainingPrincipal} EUR ({c.remainingTermMonths} mois)
                    </li>
                ))}
            </ul>
        </div>
    );
}
