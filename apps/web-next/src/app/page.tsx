import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./page.module.css";
import { AccountCreator } from "./components/AccountCreator";
import { AccountRow } from "./components/AccountRow";
import { TransferForm } from "./components/TransferForm";
import { getLocale, t } from "./i18n";

type Account = {
    id: string;
    name: string;
    iban: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isActive: boolean;
    createdAt: string;
};

type CurrentUser = {
    id: string;
    email: string;
    name?: string;
    role?: string;
};

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

function deriveDbLabel(): string {
    const driver = process.env.DB_DRIVER;
    if (driver) return driver;
    const url = process.env.DATABASE_URL ?? "";
    if (url.startsWith("postgres")) return "postgres";
    if (url.startsWith("mysql")) return "mysql/mariadb";
    return "inconnue";
}

export default async function Home({ searchParams }: { searchParams: { lang?: string } }) {
    const [{ authenticated, accounts }, currentUser] = await Promise.all([loadAccounts(), loadCurrentUser()]);
    const backend = process.env.BACKEND_TARGET ?? "nest";
    const dbLabel = deriveDbLabel();
    const locale = getLocale(searchParams?.lang);

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <section className={styles.panel}>
                    <div className={styles.subtitle}>
                        {t(locale, "welcome", { backend, db: dbLabel })}{" "}
                        {currentUser ? `— ${t(locale, "helloUser", { name: currentUser.name ?? currentUser.email, role: currentUser.role ?? "client" })}` : ""}
                    </div>
                    <div className={styles.title}>{t(locale, "title")}</div>
                    <div className={styles.subtitle}>{t(locale, "subtitle")}</div>
                    <div className={styles.actions}>
                        <Link className={styles.link} href="/register">{t(locale, "createAccount")}</Link>
                        <Link className={styles.link} href="/login">{t(locale, "login")}</Link>
                        <Link className={styles.link} href="/transfers">{t(locale, "transfers")}</Link>
                        <Link className={styles.link} href="/advisor/credits">Crédits (conseiller)</Link>
                        {authenticated && (
                            <form action="/api/auth/logout" method="post">
                                <button type="submit" className={styles.link}>{t(locale, "logout")}</button>
                            </form>
                        )}
                    </div>

                    {!authenticated && (
                        <div className={styles.empty}>
                            {t(locale, "notAuth")}
                        </div>
                    )}

                    {authenticated && accounts.length === 0 && (
                        <div className={styles.empty}>
                            {t(locale, "noAccounts")}
                        </div>
                    )}

                    {accounts.length > 0 && (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>IBAN</th>
                                    <th>Type</th>
                                    <th>Solde</th>
                                    <th>Statut</th>
                                    <th>Ouvert le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc) => (
                                    <AccountRow key={acc.id} account={acc} />
                                ))}
                            </tbody>
                        </table>
                    )}

                    {authenticated && (
                        <div className={styles.grid2}>
                            <div className={styles.card}>
                                <div className={styles.title}>{t(locale, "addAccount")}</div>
                                <AccountCreator />
                            </div>
                            {accounts.length > 0 && (
                                <div className={styles.card}>
                                    <div className={styles.title}>{t(locale, "transfer")}</div>
                                    <div className={styles.subtitle}>{t(locale, "transferInfo")}</div>
                                    <TransferForm accounts={accounts} />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
