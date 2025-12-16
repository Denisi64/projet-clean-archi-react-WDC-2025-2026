"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Account = {
    id: string;
    iban: string;
    name: string;
};

export default function TransferCard({ accounts }: { accounts: Account[] }) {
    const router = useRouter();
    const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id ?? "");
    const [destinationIban, setDestinationIban] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (accounts.length === 0) return;
        const exists = accounts.some((account) => account.id === sourceAccountId);
        if (!exists) {
            setSourceAccountId(accounts[0]?.id ?? "");
        }
    }, [accounts, sourceAccountId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        const numericAmount = Number(amount);
        if (!sourceAccountId || Number.isNaN(numericAmount) || numericAmount <= 0) {
            setError("Montant invalide ou compte source manquant.");
            setLoading(false);
            return;
        }

        try {
            const resp = await fetch("/api/transfers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    sourceAccountId,
                    destinationIban: destinationIban.trim(),
                    amount: numericAmount,
                    note,
                }),
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => null);
                setError(data?.code ?? "UNEXPECTED_ERROR");
                return;
            }
            setMessage("Transfert effectué");
            setDestinationIban("");
            setAmount("");
            setNote("");
            router.refresh();
        } catch (err: any) {
            setError(err?.message ?? "UNEXPECTED_ERROR");
        } finally {
            setLoading(false);
        }
    };

    if (accounts.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Effectuer un transfert</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={submit}>
                    <div className="space-y-1">
                        <Label>Compte source</Label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={sourceAccountId}
                            onChange={(e) => setSourceAccountId(e.target.value)}
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.iban})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>IBAN destination (interne)</Label>
                        <Input value={destinationIban} onChange={(e) => setDestinationIban(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label>Montant</Label>
                        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label>Note</Label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Transfert..." : "Transférer"}
                    </Button>
                    {error && <div className="text-sm text-destructive">Erreur : {error}</div>}
                    {message && <div className="text-sm text-emerald-600">{message}</div>}
                </form>
            </CardContent>
        </Card>
    );
}
