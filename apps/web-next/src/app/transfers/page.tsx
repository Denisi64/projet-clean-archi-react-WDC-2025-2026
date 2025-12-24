import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TransfersHistoryClient } from "./transfers-history.client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type Account = {
    id: string;
    name: string;
    iban: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isActive: boolean;
    createdAt: string;
};

type Transfer = {
    id: string;
    source: Account;
    destination: Account;
    amount: string;
    note?: string;
    createdAt: string;
    direction: "IN" | "OUT";
};

type CurrentUser = {
    id: string;
    email: string;
    role?: string;
    bannedAt?: string | null;
};

async function loadTransfers(accountId?: string): Promise<{ authenticated: boolean; transfers: Transfer[] }> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    if (!cookieHeader) {
        return { authenticated: false, transfers: [] };
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = new URL(`${base}/api/transfers/history`);
    if (accountId) url.searchParams.set("accountId", accountId);

    const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);

    if (!res || res.status === 401) {
        return { authenticated: false, transfers: [] };
    }
    if (!res.ok) {
        return { authenticated: true, transfers: [] };
    }

    const data = (await res.json()) as { transfers?: Transfer[] };
    return { authenticated: true, transfers: data.transfers ?? [] };
}

async function loadAccounts(): Promise<{ authenticated: boolean; accounts: Account[] }> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

    if (!cookieHeader) {
        return { authenticated: false, accounts: [] };
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/accounts/me`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);

    if (!res || res.status === 401) {
        return { authenticated: false, accounts: [] };
    }
    if (!res.ok) {
        return { authenticated: true, accounts: [] };
    }

    const data = (await res.json()) as { accounts?: Account[] };
    return { authenticated: true, accounts: data.accounts ?? [] };
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

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

export default async function TransfersHistoryPage({ searchParams }: { searchParams: { accountId?: string } }) {
    const accountId = searchParams.accountId || undefined;
    const [{ authenticated, transfers }, accountsResult, currentUser] = await Promise.all([
        loadTransfers(accountId),
        loadAccounts(),
        loadCurrentUser(),
    ]);
    const accounts = accountsResult.accounts;

    if (currentUser?.bannedAt) {
        redirect("/banned");
    }

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-[1600px] space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Historique des transferts</h1>
                        <p className="text-muted-foreground">
                            Liste des virements internes (entrants et sortants) associés à vos comptes Avenir Bank.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                        >
                            <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
                        </Link>
                    </div>
                </div>

                {!authenticated && (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border shadow-sm">
                        Connectez-vous pour consulter vos transferts.
                    </div>
                )}

                {authenticated && (
                    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Chargement de l&apos;historique...</div>}>
                        <TransfersHistoryClient
                            accounts={accounts}
                            initialTransfers={transfers}
                            initialAccountId={accountId}
                        />
                    </Suspense>
                )}
            </div>
        </main>
    );
}
