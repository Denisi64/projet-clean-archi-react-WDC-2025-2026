import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./page.module.css";
import { AccountCreator } from "./components/AccountCreator";
import { AccountRow } from "./components/AccountRow";
import { TransferForm } from "./components/TransferForm";

type Account = {
    id: string;
    name: string;
    iban: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isActive: boolean;
    createdAt: string;
};

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

export default async function Home() {
    const { authenticated, accounts } = await loadAccounts();

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <section className={styles.panel}>
                    <div className={styles.title}>Mes comptes bancaires</div>
                    <div className={styles.subtitle}>
                        Chaque utilisateur reçoit un compte courant dès l'inscription. Cette section affiche IBAN, solde et statut.
                    </div>
                    <div className={styles.actions}>
                        <Link className={styles.link} href="/register">Créer un compte</Link>
                        <Link className={styles.link} href="/login">Se connecter</Link>
                        <Link className={styles.link} href="/transfers">Historique des transferts</Link>
                        {authenticated && (
                            <form action="/api/auth/logout" method="post">
                                <button type="submit" className={styles.link}>Se déconnecter</button>
                            </form>
                        )}
                    </div>

                    {!authenticated && (
                        <div className={styles.empty}>
                            Connectez-vous pour récupérer vos comptes. Après confirmation d'email, rechargez la page.
                        </div>
                    )}

                    {authenticated && accounts.length === 0 && (
                        <div className={styles.empty}>
                            Aucun compte trouvé pour ce profil. Créez un nouvel utilisateur puis reconnectez-vous.
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
                                <div className={styles.title}>Ajouter un compte</div>
                                <AccountCreator />
                            </div>
                            {accounts.length > 0 && (
                                <div className={styles.card}>
                                    <div className={styles.title}>Effectuer un transfert</div>
                                    <div className={styles.subtitle}>
                                        Transferts internes uniquement (IBAN d'un compte Avenir Bank). Le solde s'actualise automatiquement.
                                    </div>
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
