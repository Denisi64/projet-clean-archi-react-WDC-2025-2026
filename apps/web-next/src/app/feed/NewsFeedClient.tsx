"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type NewsItem = {
    id: string;
    title: string;
    body: string | null;
    createdAt: string;
    createdById: string;
};

type Props = {
    initialNews: NewsItem[];
    locale: string;
};

export function NewsFeedClient({ initialNews, locale }: Props) {
    const t = useTranslations("newsFeed");
    const [items, setItems] = useState<NewsItem[]>(initialNews);

    const formatter = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        [locale],
    );

    useEffect(() => {
        const es = new EventSource("/api/news/stream");

        const handler = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data) as NewsItem;
                setItems((prev) => {
                    if (prev.some((item) => item.id === payload.id)) return prev;
                    return [payload, ...prev];
                });
            } catch {
                /* ignore */
            }
        };

        es.addEventListener("news", handler);
        es.addEventListener("error", () => {
            /* EventSource auto-reconnects */
        });

        return () => {
            es.removeEventListener("news", handler);
            es.close();
        };
    }, []);

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    {t("empty")}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <Card key={item.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {formatter.format(new Date(item.createdAt))}
                        </p>
                    </CardHeader>
                    {item.body && (
                        <CardContent>
                            <p className="text-sm text-foreground">{item.body}</p>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}
