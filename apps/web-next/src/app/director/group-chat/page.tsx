import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { GroupChatClient } from "@/app/group-chat/GroupChatClient";

type CurrentUser = { id: string; email: string; role: string | null };
type Message = {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    senderRole: "ADVISOR" | "DIRECTOR";
};

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

async function loadMessages(): Promise<Message[]> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
    if (!cookieHeader) return [];

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/chat/group?limit=50`, {
        method: "GET",
        cache: "no-store",
        headers: { cookie: cookieHeader },
    }).catch(() => null);

    if (!res || !res.ok) return [];
    const data = (await res.json()) as { messages?: Message[] };
    return data.messages ?? [];
}

export default async function DirectorGroupChatPage() {
    const t = await getTranslations("groupChatPage");
    const user = await loadCurrentUser();
    if (!user || user.role !== "DIRECTOR") {
        redirect("/");
    }

    const messages = await loadMessages();

    return (
        <main className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{t("kicker")}</p>
                        <h1 className="text-3xl font-bold">{t("title")}</h1>
                        <p className="text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                        {t("back")}
                    </Link>
                </div>

                <GroupChatClient initialMessages={messages} />
            </div>
        </main>
    );
}
