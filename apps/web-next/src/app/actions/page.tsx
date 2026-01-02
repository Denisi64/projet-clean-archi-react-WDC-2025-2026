import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActionsClient } from "./actions.client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionItem = {
    id: string;
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
};

type PortfolioPosition = {
    actionId: string;
    symbol: string;
    name: string;
    price: string;
    isAvailable: boolean;
    quantity: string;
    avgPrice: string;
};

type CurrentUser = {
    id: string;
    email: string;
    role?: string;
    bannedAt?: string | null;
};

async function loadActions(): Promise<ActionItem[]> {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/actions`, { method: "GET", cache: "no-store" }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as { actions?: ActionItem[] };
    return data.actions ?? [];
}

async function loadPortfolio(cookieHeader: string): Promise<PortfolioPosition[]> {
    if (!cookieHeader) return [];
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/actions/portfolio`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);
    if (!res || !res.ok) return [];
    const data = (await res.json()) as { positions?: PortfolioPosition[] };
    return data.positions ?? [];
}

async function loadCurrentUser(cookieHeader: string): Promise<CurrentUser | null> {
    if (!cookieHeader) return null;
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/auth/me`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);
    if (!res || !res.ok) return null;
    const data = (await res.json()) as { user?: CurrentUser };
    return data.user ?? null;
}

export default async function ActionsPage() {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    const [actions, currentUser] = await Promise.all([loadActions(), loadCurrentUser(cookieHeader)]);
    if (currentUser?.bannedAt) {
        redirect("/banned");
    }
    const positions = currentUser ? await loadPortfolio(cookieHeader) : [];

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Actions Avenir Bank</h1>
                        <p className="text-muted-foreground">
                            Achat et vente d&apos;actions avec stock mis a jour en temps reel.
                        </p>
                    </div>
                    <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                        Retour
                    </Link>
                </div>

                <ActionsClient
                    authenticated={Boolean(currentUser)}
                    initialActions={actions}
                    initialPositions={positions}
                />
            </div>
        </main>
    );
}
