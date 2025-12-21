"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select-native";

export function AccountCreator() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const [typeValue, setTypeValue] = useState<"CURRENT" | "SAVINGS">("CURRENT");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const rawName = (form.get("name") as string)?.trim() ?? "";
        const isValidName = rawName.length >= 2;
        const name = isValidName ? rawName : undefined;
        const type = (form.get("type") as string) === "SAVINGS" ? "SAVINGS" : "CURRENT";

        if (!isValidName) {
            setError("Le nom du compte est requis (2 caractères minimum).");
            setLoading(false);
            return;
        }

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

            setNameValue("");
            setTypeValue(type);
            router.refresh();
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
                <Input
                    id="name"
                    name="name"
                    value={nameValue}
                    onChange={(event) => setNameValue(event.target.value)}
                    placeholder="Ex: Compte Perso"
                    minLength={2}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                    id="type"
                    name="type"
                    value={typeValue}
                    onChange={(event) =>
                        setTypeValue(event.target.value === "SAVINGS" ? "SAVINGS" : "CURRENT")
                    }
                >
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
