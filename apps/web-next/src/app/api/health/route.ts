import { NextResponse } from 'next/server';
import {prisma} from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function driverFrom(url?: string) {
    if (!url) return 'memory';
    try {
        const p = new URL(url).protocol.replace(':', '');
        if (p.startsWith('postgres')) return 'postgres';
        if (p.startsWith('mysql')) return 'mariadb';
        return p;
    } catch { return 'unknown'; }
}

export async function GET() {
    const target = (process.env.BACKEND_TARGET || 'next').toLowerCase();

    if (target === 'nest') {
        const base = process.env.NEST_API_URL || 'http://localhost:3001';
        try {
            const r = await fetch(`${base}/health/db`, { cache: 'no-store' });
            const json = await r.json();
            return NextResponse.json(json);
        } catch (e: any) {
            return NextResponse.json({ backend: 'nest', ok: false, message: String(e?.message || e) }, { status: 502 });
        }
    }
    try {
        const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
        return NextResponse.json({ backend: 'next', driver: driverFrom(process.env.DATABASE_URL), ok: Array.isArray(rows) && rows.length > 0 });
    } catch (e: any) {
        return NextResponse.json({ backend: 'next', driver: driverFrom(process.env.DATABASE_URL), ok: false, message: String(e?.message || e) }, { status: 500 });
    }
}
