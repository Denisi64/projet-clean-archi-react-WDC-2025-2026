"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type CreditResponse = {
    id: string;
    monthlyDue: string;
    termMonths: number;
    annualRate: number;
    insuranceRate: number;
};

export default function AdvisorCreditsPage() {
    const [form, setForm] = useState({
        userId: "",
        principal: "10000",
        annualRate: "0.03",
        insuranceRate: "0.002",
        termMonths: "36",
        token: "",
    });
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<CreditResponse | null>(null);

    const searchUsers = async (q: string) => {
        if (q.trim().length < 2) {
            setUsers([]);
            return;
        }
        setSearching(true);
        try {
            const resp = await fetch(`/api/advisor/users?query=${encodeURIComponent(q)}`, {
                headers: {
                    "x-advisor-token": form.token || "dev-advisor",
                },
            });
            if (!resp.ok) {
                setUsers([]);
                return;
            }
            const data = await resp.json();
            const list = (data.users ?? []).map((u: any) => ({
                id: u.id,
                label: `${u.name} <${u.email}>`,
            }));
            setUsers(list);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const handle = setTimeout(() => {
            searchUsers(query);
        }, 200);
        return () => clearTimeout(handle);
    }, [query, form.token]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const resp = await fetch("/api/advisor/credits", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-advisor-token": form.token || "dev-advisor",
                },
                body: JSON.stringify({
                    userId: form.userId.trim(),
                    principal: Number(form.principal),
                    annualRate: Number(form.annualRate),
                    insuranceRate: Number(form.insuranceRate),
                    termMonths: Number(form.termMonths),
                }),
            });

            if (!resp.ok) {
                const data = await resp.json().catch(() => null);
                setError(data?.code ?? "UNEXPECTED_ERROR");
                setLoading(false);
                return;
            }

            const data = await resp.json();
            setSuccess({
                id: data.credit.id,
                monthlyDue: data.credit.monthlyDue,
                termMonths: data.credit.termMonths,
                annualRate: data.credit.annualRate,
                insuranceRate: data.credit.insuranceRate,
            });
        } catch (err: any) {
            setError(err?.message ?? "UNEXPECTED_ERROR");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <main className={styles.page}>
            <div className={styles.actions}>
                <a className={styles.link} href="/">← Retour à l'accueil</a>
            </div>
            <div className={styles.card}>
                <div className={styles.title}>Octroyer un crédit</div>
                <div className={styles.subtitle}>
                    Calcul en annuité constante avec assurance répartie dans les mensualités.
                </div>
                <form className={styles.form} onSubmit={submit}>
                    <label className={styles.wide}>
                        Rechercher un client (nom/email)
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tapez au moins 2 caractères"
                        />
                    </label>
                    <label className={styles.wide}>
                        Sélectionner un client
                        <select
                            value={form.userId}
                            onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                        >
                            <option value="">— Choisir —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </select>
                        {searching && <small>Recherche...</small>}
                    </label>
                    <label>
                        Montant (principal)
                        <input type="number" step="0.01" value={form.principal} onChange={onChange("principal")} />
                    </label>
                    <label>
                        Taux annuel (ex: 0.03)
                        <input type="number" step="0.0001" value={form.annualRate} onChange={onChange("annualRate")} />
                    </label>
                    <label>
                        Taux assurance (ex: 0.002)
                        <input
                            type="number"
                            step="0.0001"
                            value={form.insuranceRate}
                            onChange={onChange("insuranceRate")}
                        />
                    </label>
                    <label>
                        Durée (mois)
                        <input type="number" value={form.termMonths} onChange={onChange("termMonths")} />
                    </label>
                    <label className={styles.wide}>
                        Token conseiller (x-advisor-token)
                        <input value={form.token} onChange={onChange("token")} placeholder="dev-advisor si vide" />
                    </label>
                    <div className={`${styles.actions} ${styles.wide}`}>
                        <button className={styles.button} type="submit" disabled={loading}>
                            {loading ? "Calcul..." : "Octroyer"}
                        </button>
                    </div>
                </form>
                {error && <div className={`${styles.alert} ${styles.error}`}>Erreur : {error}</div>}
                {success && (
                    <div className={`${styles.alert} ${styles.ok}`}>
                        Crédit créé (id {success.id}) — Mensualité : {success.monthlyDue} EUR sur {success.termMonths} mois
                    </div>
                )}
            </div>
        </main>
    );
}
