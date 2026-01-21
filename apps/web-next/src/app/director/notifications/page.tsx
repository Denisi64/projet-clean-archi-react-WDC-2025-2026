import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PersonalNotificationForm } from "@/app/components/PersonalNotificationForm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default async function DirectorNotificationsPage() {
    const user = await loadCurrentUser();
    if (!user || user.role !== "DIRECTOR") {
        redirect("/");
    }

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Direction</p>
                        <h1 className="text-3xl font-bold">Notifications personnalisees</h1>
                        <p className="text-muted-foreground">
                            Envoyer une notification a un client specifique via SSE.
                        </p>
                    </div>
                    <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                        Retour accueil
                    </Link>
                </div>
                <PersonalNotificationForm />
            </div>
        </main>
    );
}
