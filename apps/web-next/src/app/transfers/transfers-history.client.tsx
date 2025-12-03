"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import styles from "./history.module.css";
import { Select } from "../design/atoms/Select";
import { Table, TableWrapper } from "../design/atoms/Table";
import { Tag } from "../design/atoms/Tag";

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
                    setError("Impossible de charger l'historique.");
                    return;
                }
                const data = (await resp.json()) as { transfers?: Transfer[] };
                setTransfers(data.transfers ?? []);
            } catch (e: any) {
                if (e?.name !== "AbortError") setError("Impossible de charger l'historique.");
            }
        });
        return () => controller.abort();
    }, [selectedAccountId]);

    function formatCurrency(amount: string) {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2,
        }).format(Number(amount));
    }

    return (
        <>
            <div className={styles.filter}>
                <label className={styles.label} htmlFor="accountId">Filtrer par compte</label>
                <div className={styles.filterRow}>
                    <Select
                        id="accountId"
                        name="accountId"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                        <option value="">Tous les comptes</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>
                    {loading && <span className={styles.muted}>Chargement…</span>}
                </div>
            </div>

            {error && <div className={styles.empty}>{error}</div>}

            {transfers.length === 0 && !error && (
                <div className={styles.empty}>
                    Aucun transfert pour le moment. Effectuez un virement depuis la page d&apos;accueil.
                </div>
            )}

            {transfers.length > 0 && (
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <th>Direction</th>
                                <th>Source</th>
                                <th>Destination</th>
                                <th>Montant</th>
                                <th>Motif</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <Tag variant={t.direction === "OUT" ? "warning" : "success"}>
                                            {t.direction === "OUT" ? "Sortant" : "Entrant"}
                                        </Tag>
                                    </td>
                                    <td>
                                        <div className={styles.accountCell}>
                                            <div className={styles.name}>{t.source.name}</div>
                                            <div className={styles.iban}>{t.source.iban}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.accountCell}>
                                            <div className={styles.name}>{t.destination.name}</div>
                                            <div className={styles.iban}>{t.destination.iban}</div>
                                        </div>
                                    </td>
                                    <td className={styles.amount}>
                                        {t.direction === "OUT" ? "-" : "+"} {formatCurrency(t.amount)}
                                    </td>
                                    <td className={styles.note}>{t.note || "—"}</td>
                                    <td>{new Date(t.createdAt).toLocaleString("fr-FR")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </TableWrapper>
            )}
        </>
    );
}
