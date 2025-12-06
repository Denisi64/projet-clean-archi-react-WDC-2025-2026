import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
    const h = headers();
    const proto = h.get('x-forwarded-proto');
    const host  = h.get('x-forwarded-host') || h.get('host');
    if (proto && host) return `${proto}://${host}`;
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    return 'http://localhost:3000';
}

export default async function HealthPage() {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/health`, { cache: 'no-store' });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return (
            <main style={{ padding: 24 }}>
                <h1>DB Health</h1>
                <p style={{ color: 'red' }}>Erreur: {res.status} {res.statusText}</p>
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
