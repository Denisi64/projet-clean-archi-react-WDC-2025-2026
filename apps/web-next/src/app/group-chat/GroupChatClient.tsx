"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Message = {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    senderRole: "ADVISOR" | "DIRECTOR";
};

type Props = {
    initialMessages: Message[];
};

function resolveWsCandidates(): string[] {
    const backend = process.env.NEXT_PUBLIC_BACKEND_TARGET || process.env.BACKEND_TARGET || "nest";
    const candidates: string[] = [];
    if (process.env.NEXT_PUBLIC_WS_URL) candidates.push(process.env.NEXT_PUBLIC_WS_URL);
    if (process.env.NEXT_PUBLIC_NEST_API_URL) candidates.push(process.env.NEXT_PUBLIC_NEST_API_URL);
    if (backend === "nest") {
        candidates.push("http://localhost:3001", "http://localhost:4001");
    } else {
        candidates.push("http://localhost:4001", "http://localhost:3001");
    }
    return Array.from(new Set(candidates.filter(Boolean)));
}

export function GroupChatClient({ initialMessages }: Props) {
    const t = useTranslations("groupChat");
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const wsCandidates = useMemo(() => resolveWsCandidates(), []);
    const listRef = useRef<HTMLDivElement | null>(null);

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
                s.emit("group-join");
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
        const handler = (payload: Message) => {
            setMessages((prev) => {
                if (prev.some((item) => item.id === payload.id)) return prev;
                return [payload, ...prev];
            });
        };
        socket.on("group-message", handler);
        return () => {
            socket.off("group-message", handler);
        };
    }, [socket]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = 0;
    }, [messages.length]);

    const submit = async () => {
        const trimmed = content.trim();
        if (!trimmed) return;
        setError(null);

        const resp = await fetch("/api/chat/group", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ content: trimmed }),
        }).catch(() => null);
        if (!resp) {
            setError(t("serverError"));
            return;
        }
        if (!resp.ok) {
            const data = await resp.json().catch(() => null);
            setError(data?.code ?? t("serverError"));
            return;
        }
        setContent("");
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <div
                        ref={listRef}
                        className="flex max-h-[420px] flex-col-reverse gap-3 overflow-auto rounded-md border bg-background p-4"
                    >
                        {messages.length === 0 && (
                            <div className="text-sm text-muted-foreground">{t("empty")}</div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        {msg.senderName}
                                    </span>
                                    {msg.senderRole === "DIRECTOR" && (
                                        <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                                            {t("directorBadge")}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">{msg.senderRole}</span>
                                </div>
                                <div className={cn("rounded-md border px-3 py-2 text-sm", "bg-muted/30")}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Input
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder={t("inputPlaceholder")}
                        />
                        <Button onClick={submit}>{t("send")}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
