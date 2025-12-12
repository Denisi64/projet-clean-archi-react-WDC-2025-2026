"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { TableCell, TableRow } from "../../components/ui/table";

type Account = {
    id: string;
    name: string;
    iban: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isActive: boolean;
    createdAt: string;
};

type Props = {
    account: Account;
};

export function AccountRow({ account }: Props) {
    const router = useRouter();
    const [name, setName] = useState(account.name);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(account.name);
    }, [account.name]);

    function formatCurrency(amount: string) {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 2,
        }).format(Number(amount));
    }

    async function handleRename(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const trimmed = name.trim();
        try {
            const res = await fetch(`/api/accounts/${account.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.code ?? "Impossible de renommer le compte.");
                return;
            }

            setEditing(false);
            router.refresh();
        } catch (err) {
            setError("Impossible de renommer le compte.");
        } finally {
            setLoading(false);
        }
    }

    async function handleClose() {
        if (!account.isActive) return;
        const confirmed = window.confirm("Clôturer ce compte ? Il passera en statut inactif.");
        if (!confirmed) return;

        setClosing(true);
        setError(null);
        try {
            const res = await fetch(`/api/accounts/${account.id}/close`, {
                method: "POST",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.code ?? "Impossible de clôturer le compte.");
                return;
            }

            router.refresh();
        } catch (err) {
            setError("Impossible de clôturer le compte.");
        } finally {
            setClosing(false);
        }
    }

    return (
        <TableRow>
            <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                    {!editing ? (
                        <span>{account.name}</span>
                    ) : (
                        <form className="flex items-center gap-2" onSubmit={handleRename}>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={2}
                                maxLength={80}
                                aria-label="Nouveau nom du compte"
                                className="h-8 w-40"
                            />
                            <Button type="submit" size="sm" disabled={loading}>
                                OK
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => {
                                    setEditing(false);
                                    setName(account.name);
                                }}
                                disabled={loading}
                            >
                                X
                            </Button>
                        </form>
                    )}
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
            </TableCell>
            <TableCell>{account.iban}</TableCell>
            <TableCell>
                <Badge variant={account.type === "CURRENT" ? "outline" : "secondary"}>
                    {account.type === "CURRENT" ? "Courant" : "Épargne"}
                </Badge>
            </TableCell>
            <TableCell>{formatCurrency(account.balance)}</TableCell>
            <TableCell>
                <Badge variant={account.isActive ? "default" : "destructive"}>
                    {account.isActive ? "Actif" : "Clôturé"}
                </Badge>
            </TableCell>
            <TableCell>{new Date(account.createdAt).toLocaleDateString("fr-FR")}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                            setError(null);
                            setEditing((prev) => {
                                if (prev) {
                                    setName(account.name);
                                }
                                return !prev;
                            });
                        }}
                        disabled={closing}
                    >
                        {editing ? "Fermer" : "Renommer"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={handleClose}
                        disabled={!account.isActive || closing}
                    >
                        {closing ? "..." : "Clôturer"}
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
