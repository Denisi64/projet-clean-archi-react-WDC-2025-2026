import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SavingsRateCard } from "./SavingsRateCard";

type CurrentUser = { id: string; email: string; role: string | null };

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
    if (!data.user) return null;
    return { ...data.user, role: data.user.role ?? null };
}

export default async function SavingsRatePage() {
    const user = await loadCurrentUser();
    if (!user || user.role !== "DIRECTOR") {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Administration Directeur</p>
                        <h1 className="text-3xl font-bold">Fixer le taux d&apos;épargne</h1>
                        <p className="text-muted-foreground">
                            Ajustez le taux annuel appliqué aux comptes d&apos;épargne. Uniquement visible par
                            les directeurs.
                        </p>
                    </div>
                    <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                        Retour
                    </Link>
                </div>

                <SavingsRateCard />
            </div>
        </main>
    );
}
