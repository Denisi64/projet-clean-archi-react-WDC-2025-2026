import Link from "next/link";
import { cookies } from "next/headers";
import { AccountCreator } from "./components/AccountCreator";
import { AccountRow } from "./components/AccountRow";
import { TransferForm } from "./components/TransferForm";
import { buttonVariants } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { cn } from "../lib/utils";
import { ArrowRight, Banknote, Building2, CreditCard, ShieldCheck, Wallet } from "lucide-react";

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

export default async function Home() {
    const { authenticated, accounts } = await loadAccounts();

    // --- UNAUTHENTICATED VIEW (LANDING PAGE) ---
    if (!authenticated) {
        return (
            <main className="flex min-h-screen flex-col bg-background">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-24 lg:py-32">
                    <div className="container relative z-10 mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl max-w-3xl bg-gradient-to-r from-blue-300 to-blue-600 bg-clip-text text-transparent">
                                La banque qui donne vie à vos projets
                            </h1>
                            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                                Avenir Bank réinvente la gestion de patrimoine avec une interface fluide, sécurisée et pensée pour vous.
                                Ouvrez votre compte en 2 minutes.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                                <Link
                                    href="/register"
                                    className={cn(buttonVariants({ size: "lg" }), "gap-2 px-8")}
                                >
                                    S'inscrire maintenant <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/login"
                                    className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                                >
                                    Espace Client
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-full w-full max-w-7xl opacity-50 blur-3xl overflow-hidden pointer-events-none">
                        <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-primary/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                        <div className="absolute top-[30%] left-[10%] h-[300px] w-[300px] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
                    <div className="grid gap-8 md:grid-cols-3">
                        <Card className="bg-card/50 backdrop-blur-sm border-muted">
                            <CardHeader>
                                <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Sécurité Maximale</CardTitle>
                                <CardDescription>
                                    Vos données et vos fonds sont protégés par les standards les plus élevés de l'industrie bancaire.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card/50 backdrop-blur-sm border-muted">
                            <CardHeader>
                                <Banknote className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Virements Instantanés</CardTitle>
                                <CardDescription>
                                    Envoyez de l'argent à vos proches ou payez vos factures en un éclair, sans frais cachés.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card/50 backdrop-blur-sm border-muted">
                            <CardHeader>
                                <Building2 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Gestion Transparente</CardTitle>
                                <CardDescription>
                                    Suivez vos dépenses en temps réel et gardez le contrôle total sur votre budget depuis notre interface.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>
            </main>
        );
    }

    // --- AUTHENTICATED VIEW (DASHBOARD) ---

    // Calculate total balance
    const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0);
    const formattedTotal = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalBalance);

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
                        <p className="text-muted-foreground">
                            Vue d'ensemble de votre situation financière.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <form action="/api/auth/logout" method="post">
                            <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
                                Se déconnecter
                            </button>
                        </form>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formattedTotal}</div>
                            <p className="text-xs text-muted-foreground">
                                Sur {accounts.length} compte(s) actif(s)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Comptes Actifs</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{accounts.filter(a => a.isActive).length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground hidden md:block">
                        <CardHeader>
                            <CardTitle>Besoin d'aide ?</CardTitle>
                            <CardDescription className="text-primary-foreground/80">Contacter votre conseiller.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Left Column: Accounts List (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Mes comptes bancaires</CardTitle>
                                <CardDescription>Gérez vos comptes courants et épargne.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {accounts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Aucun compte trouvé. Commencez par en créer un.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>IBAN</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Solde</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="hidden md:table-cell">Ouvert le</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {accounts.map((acc) => (
                                                <AccountRow key={acc.id} account={acc} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Actions (1/3 width) */}
                    <div className="space-y-6">
                        {/* New Account */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Nouveau compte</CardTitle>
                                <CardDescription>Ouvrir un nouveau compte bancaire.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AccountCreator />
                            </CardContent>
                        </Card>

                        {/* Transfer */}
                        {accounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Virement interne</CardTitle>
                                    <CardDescription>Transférez de l'argent instantanément.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TransferForm accounts={accounts} />
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-center">
                            <Link
                                href="/transfers"
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
                            >
                                Voir l'historique des transferts
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
