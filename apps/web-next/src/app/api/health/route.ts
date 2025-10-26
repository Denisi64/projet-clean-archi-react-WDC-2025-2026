import { NextResponse } from 'next/server';

export async function GET() {
    const target = (process.env.BACKEND_TARGET || 'next').toLowerCase();

    if (target === 'nest') {
        const base = process.env.NEST_API_URL || 'http://localhost:3001';
        try {
            const r = await fetch(`${base}/health/db`, { cache: 'no-store' });
            const json = await r.json();
            return NextResponse.json(json);
        } catch (e: any) {
            return NextResponse.json(
                { backend: 'nest', ok: false, message: String(e?.message || e) },
                { status: 502 }
            );
        }
    }

    // Mode next direct (mock)
    return NextResponse.json({ backend: 'next', driver: 'memory', ok: true });
}
