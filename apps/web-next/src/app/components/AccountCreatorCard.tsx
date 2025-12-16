 "use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";

export default function AccountCreatorCard() {
    const [name, setName] = useState("");
    const [type, setType] = useState<"CURRENT" | "SAVINGS">("CURRENT");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const resp = await fetch("/api/accounts", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: name.trim(), type }),
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => null);
                setError(data?.code ?? "UNEXPECTED_ERROR");
                return;
            }
            setSuccess("Compte créé");
            setName("");
        } catch (err: any) {
            setError(err?.message ?? "UNEXPECTED_ERROR");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ajouter un compte</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={submit}>
                    <div className="space-y-1">
                        <Label>Nom</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon compte" />
                    </div>
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <Select value={type} onChange={(e) => setType(e.target.value as "CURRENT" | "SAVINGS")}>
                            <option value="CURRENT">Compte courant</option>
                            <option value="SAVINGS">Épargne</option>
                        </Select>
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Création..." : "Créer"}
                    </Button>
                    {error && <div className="text-sm text-destructive">Erreur : {error}</div>}
                    {success && <div className="text-sm text-emerald-600">{success}</div>}
                </form>
            </CardContent>
        </Card>
    );
}
