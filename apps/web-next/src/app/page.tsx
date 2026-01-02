import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
import { getLocale, getTranslations } from "next-intl/server";
import CreditList from "./components/CreditList";
import AccountTable from "./components/AccountTable";
import AccountCreatorCard from "./components/AccountCreatorCard";
import TransferCard from "./components/TransferCard";
import { LanguageSwitch } from "./components/LanguageSwitch";

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
    bannedAt?: string | null;
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

export default async function Home() {
    const t = await getTranslations("home");
    const locale = await getLocale();
    const intlLocale = locale === "en" ? "en-US" : "fr-FR";
    const [{ authenticated, accounts }, currentUser] = await Promise.all([
        loadAccounts(),
        loadCurrentUser(),
    ]);

    if (currentUser?.bannedAt) {
        redirect("/banned");
    }

    const backend = process.env.BACKEND_TARGET ?? "nest";
    const dbLabel = deriveDbLabel();
    /* ----------------------------- LANDING PAGE ----------------------------- */

    if (!authenticated) {
        return (
            <main className="flex min-h-screen flex-col bg-background">
                {/* Hero */}
                <section className="relative overflow-hidden py-24 lg:py-32">
                    <div className="container relative z-10 mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <LanguageSwitch />
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl max-w-3xl bg-linear-to-l from-blue-300 to-blue-600 bg-clip-text text-transparent">
                                {t("landingTitle")}
                            </h1>
                            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl">
                                {t("landingSubtitle")}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-4">
                                <Link
                                    href="/register"
                                    className={cn(buttonVariants({ size: "lg" }), "gap-2 px-8")}
                                >
                                    {t("registerNow")} <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/login"
                                    className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                                >
                                    {t("clientSpace")}
                                </Link>
                                {(currentUser?.role === "ADVISOR" || currentUser?.role === "DIRECTOR") && (
                                    <Link
                                        href="/advisor/credits"
                                        className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                                    >
                                        {t("advisorCredits")}
                                    </Link>
                                )}
                                {currentUser?.role === "DIRECTOR" && (
                                    <Link
                                        href="/director/admin"
                                        className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                                    >
                                        {t("adminPanel")}
                                    </Link>
                                )}
                                {currentUser?.role === "DIRECTOR" && (
                                    <Link
                                        href="/director/actions"
                                        className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                                    >
                                        {t("actions")}
                                    </Link>
                                )}
                                {currentUser?.role === "DIRECTOR" && (
                                    <Link
                                        href="/director/savings-rate"
                                        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                                    >
                                        {t("savingsRate")}
                                    </Link>
                                )}
                                <Link
                                    href="/about"
                                    className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                                >
                                    {t("about")}
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
                                <CardTitle>{t("featureSecurityTitle")}</CardTitle>
                                <CardDescription>
                                    {t("featureSecurityDesc")}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Banknote className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>{t("featureTransfersTitle")}</CardTitle>
                                <CardDescription>
                                    {t("featureTransfersDesc")}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Building2 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>{t("featureTransparencyTitle")}</CardTitle>
                                <CardDescription>
                                    {t("featureTransparencyDesc")}
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
    const formattedTotal = new Intl.NumberFormat(intlLocale, {
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
                            {t("welcome", { backend, db: dbLabel })}{" "}
                            {currentUser &&
                                `— ${t("helloUser", {
                                    name: currentUser.name ?? currentUser.email,
                                    role: currentUser.role ?? "client",
                                })}`}
                        </p>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="text-muted-foreground">{t("subtitle")}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {(currentUser?.role === "ADVISOR" || currentUser?.role === "DIRECTOR") && (
                            <Link
                                href="/advisor/credits"
                                className={cn(buttonVariants({ variant: "secondary" }))}
                            >
                                {t("advisorCredits")}
                            </Link>
                        )}
                        {currentUser?.role === "DIRECTOR" && (
                            <Link
                                href="/director/admin"
                                className={cn(buttonVariants({ variant: "secondary" }))}
                            >
                                {t("adminPanel")}
                            </Link>
                        )}
                        {currentUser?.role === "DIRECTOR" && (
                            <Link
                                href="/director/actions"
                                className={cn(buttonVariants({ variant: "secondary" }))}
                            >
                                {t("actions")}
                            </Link>
                        )}
                        {currentUser?.role === "DIRECTOR" && (
                            <Link
                                href="/director/savings-rate"
                                className={cn(buttonVariants({ variant: "outline" }))}
                            >
                                {t("savingsRate")}
                            </Link>
                        )}
                        <form action="/api/auth/logout" method="post">
                            <button className={cn(buttonVariants({ variant: "outline" }))}>
                                {t("logout")}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">{t("totalBalance")}</CardTitle>
                            <Wallet className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formattedTotal}</div>
                            <p className="text-xs text-muted-foreground">
                                {t("accountCount", { count: String(accounts.length) })}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-sm">{t("activeAccounts")}</CardTitle>
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
                            <CardTitle>{t("helpTitle")}</CardTitle>
                            <CardDescription className="text-primary-foreground/80">
                                {t("helpDesc")}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("myAccounts")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {accounts.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        {t("noAccounts")}
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("thName")}</TableHead>
                                                <TableHead>{t("thIban")}</TableHead>
                                                <TableHead>{t("thType")}</TableHead>
                                                <TableHead>{t("thBalance")}</TableHead>
                                                <TableHead>{t("thStatus")}</TableHead>
                                                <TableHead>{t("thOpenedAt")}</TableHead>
                                                <TableHead>{t("thActions")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <AccountTable accounts={accounts} />
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <AccountCreatorCard />

                        {accounts.length > 0 && <TransferCard accounts={accounts} />}

                        <CreditList />

                        <Link
                            href="/actions"
                            className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
                        >
                            {t("actionsLink")} <ArrowRight className="h-4 w-4" />
                        </Link>

                        <Link
                            href="/transfers"
                            className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
                        >
                            {t("transfersLink")} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
