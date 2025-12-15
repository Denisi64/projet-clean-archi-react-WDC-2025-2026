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
import {
    ArrowRight,
    Banknote,
    Building2,
    CreditCard,
    ShieldCheck,
    Wallet,
    Bitcoin,
    DollarSign,
    Activity,
    TrendingUp,
    Landmark,
    PieChart,
    Euro,
} from "lucide-react";
import { getLocale, t } from "./i18n";
import CreditList from "./components/CreditList";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   LOADERS                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                    PAGE                                    */
/* -------------------------------------------------------------------------- */

export default async function Home({ searchParams }: { searchParams: { lang?: string } }) {
    const [{ authenticated, accounts }, currentUser] = await Promise.all([
        loadAccounts(),
        loadCurrentUser(),
    ]);

    const backend = process.env.BACKEND_TARGET ?? "nest";
    const dbLabel = deriveDbLabel();
    const locale = getLocale(searchParams?.lang);

    /* ----------------------------- LANDING PAGE ----------------------------- */

    if (!authenticated) {
        return (
            <main className="flex min-h-screen flex-col bg-background">
                {/* Hero */}
                <section className="relative overflow-hidden py-24 lg:py-32">
                    <div className="container relative z-10 mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl max-w-3xl bg-linear-to-l from-blue-300 to-blue-600 bg-clip-text text-transparent">
                                La banque qui donne vie à vos projets
                            </h1>
                            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl">
                                Avenir Bank réinvente la gestion de patrimoine avec une interface fluide,
                                sécurisée et pensée pour vous.
                            </p>
                            <div className="flex flex-wrap gap-4 mt-4">
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
                                <Link
                                    href="/advisor/credits"
                                    className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                                >
                                    Crédit
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Decorations */}
                    <Bitcoin className="absolute top-10 left-[10%] h-24 w-24 text-primary opacity-30" />
                    <DollarSign className="absolute bottom-20 right-[15%] h-32 w-32 text-blue-500/40" />
                    <Euro className="absolute top-1/3 right-[5%] h-16 w-16 text-primary/50" />
                    <Activity className="absolute bottom-[10%] left-[20%] h-20 w-20 text-indigo-400/40" />
                    <TrendingUp className="absolute top-20 right-[25%] h-14 w-14 text-emerald-500/40" />
                    <Landmark className="absolute bottom-1/3 left-[5%] h-28 w-28 text-slate-400/30" />
                    <PieChart className="absolute top-1/2 right-[10%] h-20 w-20 text-purple-400/40" />
                    <CreditCard className="absolute top-[15%] left-[30%] h-12 w-12 text-blue-300/40" />
                </section>

                {/* Features */}
                <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
                    <div className="grid gap-8 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <ShieldCheck className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Sécurité Maximale</CardTitle>
                                <CardDescription>
                                    Standards bancaires les plus élevés.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Banknote className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Virements Instantanés</CardTitle>
                                <CardDescription>
                                    Argent envoyé en un éclair.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Building2 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Gestion Transparente</CardTitle>
                                <CardDescription>
                                    Suivi en temps réel.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>
            </main>
        );
    }

    /* ------------------------------- DASHBOARD ------------------------------- */

    const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
    const formattedTotal = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(totalBalance);

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-[1600px] space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {t(locale, "welcome", { backend, db: dbLabel })}{" "}
                            {currentUser &&
                                `— ${t(locale, "helloUser", {
                                    name: currentUser.name ?? currentUser.email,
                                    role: currentUser.role ?? "client",
                                })}`}
                        </p>
                        <h1 className="text-3xl font-bold">{t(locale, "title")}</h1>
                        <p className="text-muted-foreground">{t(locale, "subtitle")}</p>
                    </div>

                    <form action="/api/auth/logout" method="post">
                        <button className={cn(buttonVariants({ variant: "outline" }))}>
                            {t(locale, "logout")}
                        </button>
                    </form>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Solde total</CardTitle>
                            <Wallet className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formattedTotal}</div>
                            <p className="text-xs text-muted-foreground">
                                {accounts.length} compte(s)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">Comptes actifs</CardTitle>
                            <CreditCard className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {accounts.filter((a) => a.isActive).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hidden md:block bg-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle>Besoin d'aide ?</CardTitle>
                            <CardDescription className="text-primary-foreground/80">
                                Contactez votre conseiller
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mes comptes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {accounts.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        {t(locale, "noAccounts")}
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>IBAN</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Solde</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead>Ouvert le</TableHead>
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

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t(locale, "addAccount")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AccountCreator />
                            </CardContent>
                        </Card>

                        {accounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t(locale, "transfer")}</CardTitle>
                                    <CardDescription>{t(locale, "transferInfo")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TransferForm accounts={accounts} />
                                </CardContent>
                            </Card>
                        )}

                        <CreditList />
                    </div>
                </div>
            </div>
        </main>
    );
}
