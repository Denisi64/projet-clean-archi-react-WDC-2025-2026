"use client";

import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useToast } from "../components/ToastProvider";

type ActionItem = {
    id: string;
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
};

type PortfolioPosition = {
    actionId: string;
    symbol: string;
    name: string;
    price: string;
    isAvailable: boolean;
    quantity: string;
    avgPrice: string;
};

type StockPayload = {
    actionId: string;
    symbol: string;
    availableStock: string;
    isAvailable: boolean;
};

function resolveWsCandidates(): string[] {
    const backend = process.env.NEXT_PUBLIC_BACKEND_TARGET || process.env.BACKEND_TARGET || "nest";
    const candidates: string[] = [];
    if (process.env.NEXT_PUBLIC_WS_URL) candidates.push(process.env.NEXT_PUBLIC_WS_URL);
    if (process.env.NEXT_PUBLIC_NEST_API_URL) candidates.push(process.env.NEXT_PUBLIC_NEST_API_URL);
    if (backend === "nest") {
        candidates.push("http://localhost:3001", "http://localhost:4000");
    } else {
        candidates.push("http://localhost:4000", "http://localhost:3001");
    }
    return Array.from(new Set(candidates.filter(Boolean)));
}

type Props = {
    authenticated: boolean;
    initialActions: ActionItem[];
    initialPositions: PortfolioPosition[];
};

export function ActionsClient({ authenticated, initialActions, initialPositions }: Props) {
    const t = useTranslations("actions");
    const [actions, setActions] = useState<ActionItem[]>(initialActions);
    const [positions, setPositions] = useState<PortfolioPosition[]>(initialPositions);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const wsCandidates = useMemo(() => resolveWsCandidates(), []);
    const [socket, setSocket] = useState<Socket | null>(null);
    const { pushToast } = useToast();

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
        const handler = (payload: StockPayload) => {
            setActions((prev) =>
                prev.map((action) =>
                    action.id === payload.actionId
                        ? {
                              ...action,
                              availableStock: payload.availableStock,
                              isAvailable: payload.isAvailable,
                          }
                        : action,
                ),
            );
        };
        socket.on("action-stock-updated", handler);
        return () => {
            socket.off("action-stock-updated", handler);
        };
    }, [socket]);

    useEffect(() => {
        if (initialActions.length > 0) return;
        fetch("/api/actions", { cache: "no-store" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data?.actions) setActions(data.actions);
            })
            .catch(() => {});
    }, [initialActions.length]);

    const refreshPortfolio = async () => {
        if (!authenticated) return;
        const res = await fetch("/api/actions/portfolio", { cache: "no-store" }).catch(() => null);
        if (!res || !res.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.positions) setPositions(data.positions);
    };

    const submitTrade = async (actionId: string, side: "buy" | "sell") => {
        setError(null);
        const raw = (quantities[actionId] ?? "1").trim();
        const quantity = raw.length === 0 ? "1" : raw;
        const res = await fetch(`/api/actions/${actionId}/${side}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ quantity }),
        }).catch(() => null);
        if (!res) {
            setError(t("serverError"));
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data?.code ?? t("opError"));
            return;
        }
        setError(null);
        const message = side === "buy" ? t("buyOk") : t("sellOk");
        pushToast(message);
        await refreshPortfolio();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t("ownershipTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t("ownershipBody")}</p>
                </CardContent>
            </Card>

            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t("listTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {actions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">{t("noActions")}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("symbol")}</TableHead>
                                    <TableHead>{t("name")}</TableHead>
                                    <TableHead>{t("price")}</TableHead>
                                    <TableHead>{t("stock")}</TableHead>
                                    <TableHead>{t("availability")}</TableHead>
                                    <TableHead className="text-right">{t("operations")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actions.map((action) => {
                                    const qty = quantities[action.id] ?? "";
                                    const disabled = !authenticated || !action.isAvailable;
                                    return (
                                        <TableRow key={action.id}>
                                            <TableCell className="font-semibold">{action.symbol}</TableCell>
                                            <TableCell>{action.name}</TableCell>
                                            <TableCell>{action.price}</TableCell>
                                            <TableCell>{action.availableStock}</TableCell>
                                            <TableCell>
                                                <Badge variant={action.isAvailable ? "default" : "secondary"}>
                                                    {action.isAvailable ? t("available") : t("unavailable")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <Input
                                                        className="h-9 w-24"
                                                        inputMode="decimal"
                                                        placeholder={t("quantity")}
                                                        value={qty}
                                                        onChange={(e) =>
                                                            setQuantities((prev) => ({
                                                                ...prev,
                                                                [action.id]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                    <Button
                                                        size="sm"
                                                        disabled={disabled}
                                                        onClick={() => submitTrade(action.id, "buy")}
                                                    >
                                                        {t("buy")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={!authenticated}
                                                        onClick={() => submitTrade(action.id, "sell")}
                                                    >
                                                        {t("sell")}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {!authenticated && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            {t("loginHint")}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("portfolioTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {positions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                            {authenticated ? t("noPositionsAuth") : t("noPositionsAnon")}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("symbol")}</TableHead>
                                    <TableHead>{t("name")}</TableHead>
                                    <TableHead>{t("quantity")}</TableHead>
                                    <TableHead>{t("avgPrice")}</TableHead>
                                    <TableHead>{t("availability")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {positions.map((pos) => (
                                    <TableRow key={pos.actionId}>
                                        <TableCell className="font-semibold">{pos.symbol}</TableCell>
                                        <TableCell>{pos.name}</TableCell>
                                        <TableCell>{pos.quantity}</TableCell>
                                        <TableCell>{pos.avgPrice}</TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    "text-xs font-medium",
                                                    pos.isAvailable ? "text-emerald-600" : "text-muted-foreground",
                                                )}
                                            >
                                                {pos.isAvailable ? t("available") : t("unavailable")}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
