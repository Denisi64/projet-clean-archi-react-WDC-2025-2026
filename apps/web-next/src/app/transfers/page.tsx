import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./history.module.css";
import { Suspense } from "react";
import { TransfersHistoryClient } from "./transfers-history.client";

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

async function loadTransfers(accountId?: string): Promise<{ authenticated: boolean; transfers: Transfer[] }> {
    const cookieHeader = cookies()
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
    const cookieHeader = cookies()
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

function formatCurrency(amount: string) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
    }).format(Number(amount));
}

export default async function TransfersHistoryPage({ searchParams }: { searchParams: { accountId?: string } }) {
    const accountId = searchParams.accountId || undefined;
    const [{ authenticated, transfers }, accountsResult] = await Promise.all([
        loadTransfers(accountId),
        loadAccounts(),
    ]);
    const accounts = accountsResult.accounts;

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.title}>Historique des transferts</div>
                        <div className={styles.subtitle}>
                            Liste des virements internes (entrants et sortants) associés à vos comptes Avenir Bank.
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <Link className={styles.link} href="/">Accueil comptes</Link>
                    </div>
                </div>

                {!authenticated && (
                    <div className={styles.empty}>
                        Connectez-vous pour consulter vos transferts.
                    </div>
                )}

                {authenticated && (
                    <Suspense fallback={<div className={styles.empty}>Chargement de l&apos;historique...</div>}>
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
