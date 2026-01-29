"use client";

import { useEffect, useState } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Status = "connecting" | "open" | "error";

export function SseStatusBadge() {
    const t = useTranslations("home");
    const [status, setStatus] = useState<Status>("connecting");

    useEffect(() => {
        const es = new EventSource("/api/notifications/stream");

        es.onopen = () => {
            setStatus("open");
        };
        es.onerror = () => {
            setStatus("error");
        };

        return () => {
            es.close();
        };
    }, []);

    const label =
        status === "open" ? t("sseConnected") : status === "error" ? t("sseDisconnected") : t("sseConnecting");
    const variant = status === "open" ? "secondary" : status === "error" ? "destructive" : "outline";

    return (
        <span className={cn(badgeVariants({ variant }), "ml-2")}>{label}</span>
    );
}
