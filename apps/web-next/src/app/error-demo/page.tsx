"use client";

import { useTranslations } from "next-intl";

export default function ErrorDemoPage() {
    const t = useTranslations("errorDemo");
    if (typeof window !== "undefined") {
        throw new Error(t("message"));
    }
    return null;
}
