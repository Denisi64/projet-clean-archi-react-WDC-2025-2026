"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

const schema = z.object({
    userId: z.string().min(1, "Client requis"),
    principal: z.coerce.number().positive("Montant requis"),
    annualRate: z.coerce.number().positive("Taux annuel requis"),
    insuranceRate: z.coerce.number().nonnegative("Taux assurance requis"),
    termMonths: z.coerce.number().int().positive("Durée requise"),
});
type FormData = z.infer<typeof schema>;

export default function AdvisorCreditsPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        setError,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            userId: "",
            principal: 10000,
            annualRate: 0.03,
            insuranceRate: 0.002,
            termMonths: 36,
        },
    });
    const userId = watch("userId");
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
    const [credits, setCredits] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
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
        if (!userId && users.length > 0) {
            setValue("userId", users[0].id);
        }
    }, [users, userId, setValue]);

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
        fetchCredits(userId);
    }, [userId]);

    const submit = async (data: FormData) => {
        setError("root", { type: "clear", message: "" });
        setSuccess(null);

        try {
            const resp = await fetch("/api/advisor/credits", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    userId: data.userId.trim(),
                    principal: data.principal,
                    annualRate: data.annualRate,
                    insuranceRate: data.insuranceRate,
                    termMonths: data.termMonths,
                }),
            });

            if (!resp.ok) {
                const resData = await resp.json().catch(() => null);
                setError("root", { type: "server", message: resData?.code ?? "UNEXPECTED_ERROR" });
                return;
            }

            const resData = await resp.json();
            setSuccess({
                id: resData.credit.id,
                monthlyDue: resData.credit.monthlyDue,
                termMonths: resData.credit.termMonths,
                annualRate: resData.credit.annualRate,
                insuranceRate: resData.credit.insuranceRate,
            });
        } catch (err: any) {
            setError("root", { type: "server", message: err?.message ?? "UNEXPECTED_ERROR" });
        }
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
                        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
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
                                <Select {...register("userId")}>
                                    <option value="">— Choisir —</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.label}
                                        </option>
                                    ))}
                                </Select>
                                {errors.userId && <p className="text-sm text-destructive">{errors.userId.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Montant (principal)</Label>
                                <Input type="number" step="0.01" {...register("principal")} />
                                {errors.principal && <p className="text-sm text-destructive">{errors.principal.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Taux annuel (ex: 0.03)</Label>
                                <Input type="number" step="0.0001" {...register("annualRate")} />
                                {errors.annualRate && <p className="text-sm text-destructive">{errors.annualRate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Taux assurance (ex: 0.002)</Label>
                                <Input type="number" step="0.0001" {...register("insuranceRate")} />
                                {errors.insuranceRate && (
                                    <p className="text-sm text-destructive">{errors.insuranceRate.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Durée (mois)</Label>
                                <Input type="number" {...register("termMonths")} />
                                {errors.termMonths && <p className="text-sm text-destructive">{errors.termMonths.message}</p>}
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Calcul..." : "Octroyer"}
                                </Button>
                            </div>
                        </form>
                        {errors.root?.type === "server" && (
                            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                                Erreur : {errors.root.message}
                            </div>
                        )}
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
