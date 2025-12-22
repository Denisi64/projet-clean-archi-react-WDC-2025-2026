"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SavingsRateEvent = { ratePercent: number; userIds?: string[] };

function resolveWsCandidates(): string[] {
    const backend = process.env.NEXT_PUBLIC_BACKEND_TARGET || process.env.BACKEND_TARGET || "nest";

    const candidates: string[] = [];
    if (process.env.NEXT_PUBLIC_WS_URL) candidates.push(process.env.NEXT_PUBLIC_WS_URL);
    if (process.env.NEXT_PUBLIC_NEST_API_URL) candidates.push(process.env.NEXT_PUBLIC_NEST_API_URL);

    // Ajoute des valeurs par défaut (Nest d'abord, puis Next local)
    if (backend === "nest") {
        candidates.push("http://localhost:3001", "http://localhost:4000");
    } else {
        candidates.push("http://localhost:4000", "http://localhost:3001");
    }

    // Filtre doublons/vides
    return Array.from(new Set(candidates.filter(Boolean)));
}

export function NotificationsListener() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [banner, setBanner] = useState<{ message: string; at: number } | null>(null);
    const wsCandidates = useMemo(() => resolveWsCandidates(), []);

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
        if (wsCandidates.length === 0) return;
        let active: Socket | null = null;
        let idx = 0;

        const tryConnect = () => {
            const url = wsCandidates[idx];
            const s = io(url, { transports: ["websocket"], timeout: 2000 });
            active = s;

            const handleFail = () => {
                s.off("connect_error", handleFail);
                s.off("connect_timeout", handleFail);
                s.disconnect();
                idx += 1;
                if (idx < wsCandidates.length) {
                    tryConnect();
                }
            };

            s.once("connect_error", handleFail);
            s.once("connect_timeout", handleFail);
            s.once("connect", () => {
                s.off("connect_error", handleFail);
                s.off("connect_timeout", handleFail);
                setSocket(s);
            });
        };

        tryConnect();

        return () => {
            active?.disconnect();
        };
    }, [wsCandidates]);

    useEffect(() => {
        if (!socket) return;
        const handler = (payload: SavingsRateEvent) => {
            if (payload.userIds && currentUserId && !payload.userIds.includes(currentUserId)) {
                return;
            }
            const msg = `Nouveau taux d'épargne : ${payload.ratePercent}%`;
            setBanner({ message: msg, at: Date.now() });
            setTimeout(() => setBanner(null), 6000);
        };
        socket.on("savings-rate-updated", handler);
        return () => {
            socket.off("savings-rate-updated", handler);
        };
    }, [socket, currentUserId]);

    if (!banner) return null;

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs">
            <div
                className={cn(
                    "pointer-events-auto rounded-md border border-primary/40 bg-background/95 px-4 py-3 shadow-lg",
                    "backdrop-blur supports-[backdrop-filter]:bg-background/70",
                )}
            >
                <div className="flex items-start gap-3">
                    <div className="flex-1 text-sm text-foreground">{banner.message}</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBanner(null)}
                        className="h-6 px-2 text-xs"
                    >
                        OK
                    </Button>
                </div>
            </div>
        </div>
    );
}
