/* eslint-disable react/no-unescaped-entities */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import { Input } from "../design/atoms/Input";
import { Button } from "../design/atoms/Button";
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
        <tr>
            <td>
                <div className={styles.nameCell}>
                    <div className={styles.name}>{account.name}</div>
                    {editing && (
                        <form className={styles.inlineForm} onSubmit={handleRename}>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={2}
                                maxLength={80}
                                aria-label="Nouveau nom du compte"
                            />
                            <div className={styles.inlineButtons}>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setName(account.name);
                                    }}
                                    disabled={loading}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    )}
                    {error && <p className={styles.error}>{error}</p>}
                </div>
            </td>
            <td>{account.iban}</td>
            <td>
                <Tag variant="info">{account.type === "CURRENT" ? "Courant" : "Épargne"}</Tag>
            </td>
            <td>{formatCurrency(account.balance)}</td>
            <td>
                <Tag variant={account.isActive ? "success" : "muted"}>
                    {account.isActive ? "Actif" : "Clôturé"}
                </Tag>
            </td>
            <td>{new Date(account.createdAt).toLocaleDateString("fr-FR")}</td>
            <td>
                <div className={styles.rowActions}>
                    <Button
                        variant="secondary"
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
                        variant="danger"
                        type="button"
                        onClick={handleClose}
                        disabled={!account.isActive || closing}
                    >
                        {closing ? "Clôture..." : "Clôturer"}
                    </Button>
                </div>
            </td>
        </tr>
    );
}
