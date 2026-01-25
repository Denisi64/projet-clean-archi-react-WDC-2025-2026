"use client";

import { useEffect, useState } from "react";
import { useToast } from "./ToastProvider";

type NotificationEvent = {
    id: string;
    title: string;
    body: string | null;
    createdAt: string;
};

export function PersonalNotificationsListener() {
    const { pushToast } = useToast();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        const loadUser = async () => {
            try {
                const resp = await fetch("/api/auth/me", { cache: "no-store" });
                if (!resp.ok) return;
                const data = await resp.json().catch(() => null);
                if (!canceled && data?.user?.id) {
                    setCurrentUserId(data.user.id);
                }
            } catch {
                /* ignore */
            }
        };
        loadUser();
        return () => {
            canceled = true;
        };
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        const es = new EventSource("/api/notifications/stream");

        const handler = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data) as NotificationEvent;
                const message = payload.body ? `${payload.title} - ${payload.body}` : payload.title;
                pushToast(message);
            } catch {
                /* ignore */
            }
        };

        es.addEventListener("notification", handler);
        es.addEventListener("error", () => {
            /* EventSource auto-reconnects */
        });

        return () => {
            es.removeEventListener("notification", handler);
            es.close();
        };
    }, [currentUserId, pushToast]);

    return null;
}
