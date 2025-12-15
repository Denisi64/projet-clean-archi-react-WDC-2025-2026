"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select-native";

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
    });
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
    const [credits, setCredits] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<CreditResponse | null>(null);

    const searchUsers = async (q: string) => {
        setSearching(true);
        try {
            const resp = await fetch(`/api/advisor/users?query=${encodeURIComponent(q)}`);
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
        const handle = setTimeout(() => searchUsers(query), 200);
        return () => clearTimeout(handle);
    }, [query]);

    useEffect(() => {
        searchUsers("");
    }, []);

    useEffect(() => {
        if (!form.userId && users.length > 0) {
            setForm((prev) => ({ ...prev, userId: users[0].id }));
        }
    }, [users, form.userId]);

    useEffect(() => {
        const fetchCredits = async (userId: string) => {
            if (!userId) {
                setCredits([]);
                return;
            }
            const resp = await fetch(`/api/advisor/credits?userId=${encodeURIComponent(userId)}`);
            if (!resp.ok) {
                setCredits([]);
                return;
            }
            const data = await resp.json();
            setCredits(data.credits ?? []);
        };
        fetchCredits(form.userId);
    }, [form.userId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!form.userId) {
            setError("NO_USER_SELECTED");
            setLoading(false);
            return;
        }

        try {
            const resp = await fetch("/api/advisor/credits", {
                method: "POST",
                headers: { "content-type": "application/json" },
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
        <main className="min-h-screen bg-background py-8 px-4">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <div className="text-sm text-muted-foreground">
                    <a href="/" className="text-primary hover:underline">
                        ← Retour à l&apos;accueil
                    </a>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Octroyer un crédit</CardTitle>
                        <CardDescription>Calcul en annuité constante avec assurance répartie dans les mensualités.</CardDescription>
                        {users.length === 0 && <div className="text-sm text-destructive">Aucun utilisateur trouvé. Vérifiez le seed.</div>}
                        {searching && <div className="text-xs text-muted-foreground">Recherche...</div>}
                    </CardHeader>
                    <CardContent>
                        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Rechercher un client (nom/email)</Label>
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Tapez un nom ou email (optionnel)"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Sélectionner un client</Label>
                                <Select
                                    value={form.userId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                                >
                                    <option value="">— Choisir —</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Montant (principal)</Label>
                                <Input type="number" step="0.01" value={form.principal} onChange={onChange("principal")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Taux annuel (ex: 0.03)</Label>
                                <Input type="number" step="0.0001" value={form.annualRate} onChange={onChange("annualRate")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Taux assurance (ex: 0.002)</Label>
                                <Input type="number" step="0.0001" value={form.insuranceRate} onChange={onChange("insuranceRate")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Durée (mois)</Label>
                                <Input type="number" value={form.termMonths} onChange={onChange("termMonths")} />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Calcul..." : "Octroyer"}
                                </Button>
                            </div>
                        </form>
                        {error && <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">Erreur : {error}</div>}
                        {success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                                Crédit créé (id {success.id}) — Mensualité : {success.monthlyDue} EUR sur {success.termMonths} mois
                            </div>
                        )}
                    </CardContent>
                </Card>

                {credits.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Crédits du client</CardTitle>
                            <CardDescription>Crédits en cours (max 10 derniers)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {credits.map((c) => (
                                    <li key={c.id} className="rounded-md border border-border/70 p-3">
                                        <div className="font-semibold text-foreground">#{c.id}</div>
                                        <div>
                                            {c.status} — {c.monthlyDue} EUR/mois — restant {c.remainingPrincipal} EUR ({c.remainingTermMonths} mois)
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
