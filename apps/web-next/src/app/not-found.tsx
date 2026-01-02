import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Ghost, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
    const t = await getTranslations("errors");
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-6 text-center">
            <div className="max-w-md space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Ghost className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold">{t("notFoundTitle")}</h1>
                <p className="text-muted-foreground">{t("notFoundBody")}</p>
                <div className="flex justify-center">
                    <Link
                        href="/"
                        className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}
                    >
                        <Home className="h-4 w-4" />
                        {t("notFoundBack")}
                    </Link>
                </div>
            </div>
        </main>
    );
}
