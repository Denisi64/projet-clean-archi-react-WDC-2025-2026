"use client";

import { FormEvent, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select-native";

export function AccountCreator() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const rawName = (form.get("name") as string)?.trim() ?? "";
        const name = rawName.length >= 2 ? rawName : undefined;
        const type = (form.get("type") as string) === "SAVINGS" ? "SAVINGS" : "CURRENT";

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name, type }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.code ?? "Impossible de créer le compte.");
                return;
            }

            window.location.reload();
        } catch (err) {
            setError("Impossible de créer le compte.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <Label htmlFor="name">Nom du compte</Label>
                <Input id="name" name="name" placeholder="Ex: Compte Perso" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="CURRENT">
                    <option value="CURRENT">Courant</option>
                    <option value="SAVINGS">Épargne</option>
                </Select>
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Création..." : "Ajouter un compte"}
            </Button>
        </form>
    );
}
