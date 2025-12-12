"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select-native";

type Account = {
    id: string;
    name: string;
    iban: string;
    balance: string;
};

type Props = {
    accounts: Account[];
};

export function TransferForm({ accounts }: Props) {
    const [sourceId, setSourceId] = useState(accounts[0]?.id ?? "");
    const [destinationIban, setDestinationIban] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const options = useMemo(() => accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.iban})` })), [accounts]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/transfers", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    sourceAccountId: sourceId,
                    destinationIban: destinationIban.trim(),
                    amount: amount.trim(),
                    note: note.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.code ?? "Impossible de réaliser le transfert.");
                return;
            }

            window.location.reload();
        } catch (err) {
            setError("Impossible de réaliser le transfert.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <Label htmlFor="source">Compte source</Label>
                <Select
                    id="source"
                    name="source"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    required
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="destination">IBAN destinataire</Label>
                <Input
                    id="destination"
                    name="destination"
                    value={destinationIban}
                    onChange={(e) => setDestinationIban(e.target.value)}
                    placeholder="FR761234..."
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                    id="amount"
                    name="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="note">Motif (optionnel)</Label>
                <Input
                    id="note"
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Loyer, facture..."
                />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <Button type="submit" disabled={loading || !sourceId} className="w-full">
                {loading ? "Transfert..." : "Effectuer le transfert"}
            </Button>
        </form>
    );
}
