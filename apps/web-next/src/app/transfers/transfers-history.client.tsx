"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Select } from "@/components/ui/select-native";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Account = {
    id: string;
    name: string;
    iban: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isActive: boolean;
    createdAt: string;
};

type Transfer = {
    id: string;
    source: Account;
    destination: Account;
    amount: string;
    note?: string;
    createdAt: string;
    direction: "IN" | "OUT";
};

type Props = {
    accounts: Account[];
    initialTransfers: Transfer[];
    initialAccountId?: string;
};

export function TransfersHistoryClient({ accounts, initialTransfers, initialAccountId }: Props) {
    const t = useTranslations("transfersHistory");
    const locale = useLocale();
    const intlLocale = locale === "en" ? "en-US" : "fr-FR";
    const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId ?? "");
    const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
    const [loading, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const options = useMemo(
        () => accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.iban})` })),
        [accounts],
    );

    useEffect(() => {
        const controller = new AbortController();
        startTransition(async () => {
            try {
                setError(null);
                const params = new URLSearchParams();
                if (selectedAccountId) params.set("accountId", selectedAccountId);
                const resp = await fetch(`/api/transfers/history?${params.toString()}`, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });
                if (!resp.ok) {
                    setError(t("loadError"));
                    return;
                }
                const data = (await resp.json()) as { transfers?: Transfer[] };
                setTransfers(data.transfers ?? []);
            } catch (e: any) {
                if (e?.name !== "AbortError") setError(t("loadError"));
            }
        });
        return () => controller.abort();
    }, [selectedAccountId, t]);

    function formatCurrency(amount: string) {
        return new Intl.NumberFormat(intlLocale, {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2,
        }).format(Number(amount));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>{t("title")}</CardTitle>
                        <CardDescription>{t("subtitle")}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <div className="w-[280px]">
                            <Select
                                id="accountId"
                                name="accountId"
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                            >
                                <option value="">{t("allAccounts")}</option>
                                {options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Loading State Overlay (Optional, or just indicator) */}
                {loading && (
                    <div className="mb-4 text-sm text-muted-foreground animate-pulse">
                        {t("updating")}
                    </div>
                )}

                {error && (
                    <div className="py-8 text-center text-destructive">
                        {error}
                    </div>
                )}

                {transfers.length === 0 && !error && !loading && (
                    <div className="py-12 text-center text-muted-foreground">
                        {t("empty")}
                    </div>
                )}

                {transfers.length > 0 && (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("thType")}</TableHead>
                                    <TableHead>{t("thSource")}</TableHead>
                                    <TableHead>{t("thDestination")}</TableHead>
                                    <TableHead className="text-right">{t("thAmount")}</TableHead>
                                    <TableHead>{t("thDate")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfers.map((transfer) => (
                                    <TableRow key={transfer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {transfer.direction === "OUT" ? (
                                                    <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                        <ArrowDownLeft className="h-4 w-4" />
                                                    </div>
                                                )}
                                                <span className="font-medium">
                                                    {transfer.direction === "OUT"
                                                        ? t("outgoing")
                                                        : t("incoming")}
                                                </span>
                                            </div>
                                            {transfer.note && (
                                                <p className="text-xs text-muted-foreground mt-1 ml-9">
                                                    {t("reason")}: {transfer.note}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{transfer.source.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {transfer.source.iban}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{transfer.destination.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {transfer.destination.iban}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={
                                                    transfer.direction === "OUT"
                                                        ? "text-foreground"
                                                        : "text-green-600 dark:text-green-400 font-medium"
                                                }
                                            >
                                                {transfer.direction === "OUT" ? "-" : "+"}{" "}
                                                {formatCurrency(transfer.amount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {new Date(transfer.createdAt).toLocaleDateString(intlLocale, {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
