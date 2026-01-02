"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSwitch() {
    const locale = useLocale();
    const router = useRouter();
    const t = useTranslations("lang");

    const switchTo = (nextLocale: "fr" | "en") => {
        document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${LOCALE_MAX_AGE_SECONDS}`;
        router.refresh();
    };

    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => switchTo("fr")}
                aria-pressed={locale === "fr"}
            >
                {t("fr")}
            </button>
            <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                onClick={() => switchTo("en")}
                aria-pressed={locale === "en"}
            >
                {t("en")}
            </button>
        </div>
    );
}
