"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FetchState = "idle" | "loading" | "error";

export function SavingsRateCard() {
    const router = useRouter();
    const [ratePercent, setRatePercent] = useState<string>("");
    const [fetchState, setFetchState] = useState<FetchState>("loading");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let canceled = false;
        async function loadRate() {
            setFetchState("loading");
            const res = await fetch("/api/admin/savings/rate", { method: "GET" }).catch(() => null);
            if (!res) {
                if (!canceled) setFetchState("error");
                return;
            }
            if (!res.ok) {
                if (!canceled) setFetchState("error");
                return;
            }
            const data = (await res.json()) as { ratePercent: number | null };
            if (!canceled) {
                setRatePercent(data.ratePercent !== null ? data.ratePercent.toString() : "");
                setFetchState("idle");
            }
        }

        loadRate();
        return () => {
            canceled = true;
        };
    }, []);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const parsed = Number(ratePercent);
        if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 50) {
            setError("Le taux doit être un nombre positif (max 50%).");
            return;
        }

        setSubmitting(true);
        const res = await fetch("/api/admin/savings/rate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ratePercent: parsed }),
        }).catch(() => null);

        if (!res) {
            setError("Impossible de joindre le serveur.");
            setSubmitting(false);
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.code ?? "UNEXPECTED_ERROR");
            setSubmitting(false);
            return;
        }

        setSuccess("Taux mis à jour.");
        setSubmitting(false);
        router.refresh();
    }

    const isLoading = fetchState === "loading";

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fixer le taux d&apos;épargne</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <Label htmlFor="rate">Taux annuel (%)</Label>
                        <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            min={0.01}
                            max={50}
                            value={ratePercent}
                            onChange={(event) => setRatePercent(event.target.value)}
                            disabled={isLoading || submitting}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || submitting}>
                        {submitting ? "Mise à jour..." : "Enregistrer"}
                    </Button>
                    {error && <p className="text-sm text-destructive">Erreur : {error}</p>}
                    {success && <p className="text-sm text-emerald-600">{success}</p>}
                </form>
            </CardContent>
        </Card>
    );
}
