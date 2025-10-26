export const dynamic = 'force-dynamic';

export default async function HealthPage() {
    const res = await fetch('http://localhost:3000/api/health', { cache: 'no-store' });
    if (!res.ok) {
        return (
            <main style={{ padding: 24 }}>
                <h1>DB Health</h1>
                <p style={{ color: 'red' }}>
                    Erreur: {res.status} {res.statusText}
                </p>
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
