"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox-native";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ActionItem = {
    id: string;
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
};

type ActionEdit = { name: string; isAvailable: boolean };

export default function ActionsAdminClient() {
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [edits, setEdits] = useState<Record<string, ActionEdit>>({});
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState({
        symbol: "",
        name: "",
        price: "",
        availableStock: "",
        isAvailable: true,
    });

    const loadActions = async () => {
        const res = await fetch("/api/admin/actions", { cache: "no-store" }).catch(() => null);
        if (!res || !res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data?.actions) return;
        setActions(data.actions);
        const nextEdits: Record<string, ActionEdit> = {};
        data.actions.forEach((action: ActionItem) => {
            nextEdits[action.id] = { name: action.name, isAvailable: action.isAvailable };
        });
        setEdits(nextEdits);
    };

    useEffect(() => {
        loadActions().catch(() => {});
    }, []);

    const createAction = async () => {
        setError(null);
        const res = await fetch("/api/admin/actions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(creating),
        }).catch(() => null);
        if (!res) {
            setError("Impossible de contacter le serveur.");
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data?.code ?? "Erreur lors de la creation.");
            return;
        }
        setCreating({ symbol: "", name: "", price: "", availableStock: "", isAvailable: true });
        await loadActions();
    };

    const updateAction = async (actionId: string) => {
        setError(null);
        const payload = edits[actionId];
        const res = await fetch(`/api/admin/actions/${actionId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
        }).catch(() => null);
        if (!res) {
            setError("Impossible de contacter le serveur.");
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data?.code ?? "Erreur lors de la mise a jour.");
            return;
        }
        await loadActions();
    };

    const deleteAction = async (actionId: string) => {
        setError(null);
        const res = await fetch(`/api/admin/actions/${actionId}`, {
            method: "DELETE",
        }).catch(() => null);
        if (!res) {
            setError("Impossible de contacter le serveur.");
            return;
        }
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data?.code ?? "Erreur lors de la suppression.");
            return;
        }
        await loadActions();
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Creer une action</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-4">
                        <Input
                            placeholder="SYM"
                            value={creating.symbol}
                            onChange={(e) => setCreating((prev) => ({ ...prev, symbol: e.target.value }))}
                        />
                        <Input
                            placeholder="Nom"
                            value={creating.name}
                            onChange={(e) => setCreating((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                            placeholder="Cours"
                            inputMode="decimal"
                            value={creating.price}
                            onChange={(e) => setCreating((prev) => ({ ...prev, price: e.target.value }))}
                        />
                        <Input
                            placeholder="Stock"
                            inputMode="decimal"
                            value={creating.availableStock}
                            onChange={(e) => setCreating((prev) => ({ ...prev, availableStock: e.target.value }))}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                            checked={creating.isAvailable}
                            onChange={(e) => {
                                const checked = e.currentTarget.checked;
                                setCreating((prev) => ({ ...prev, isAvailable: checked }));
                            }}
                        />
                        Action disponible
                    </label>
                    <Button onClick={createAction}>Creer</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Actions existantes</CardTitle>
                </CardHeader>
                <CardContent>
                    {actions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Aucune action pour le moment.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Symbole</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Cours</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Disponible</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actions.map((action) => (
                                    <TableRow key={action.id}>
                                        <TableCell className="font-semibold">{action.symbol}</TableCell>
                                        <TableCell>
                                            <Input
                                                value={edits[action.id]?.name ?? action.name}
                                                onChange={(e) =>
                                                    setEdits((prev) => ({
                                                        ...prev,
                                                        [action.id]: {
                                                            name: e.target.value,
                                                            isAvailable: prev[action.id]?.isAvailable ?? action.isAvailable,
                                                        },
                                                    }))
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{action.price}</TableCell>
                                        <TableCell>{action.availableStock}</TableCell>
                                        <TableCell>
                                            <Checkbox
                                                checked={edits[action.id]?.isAvailable ?? action.isAvailable}
                                                onChange={(e) => {
                                                    const checked = e.currentTarget.checked;
                                                    setEdits((prev) => ({
                                                        ...prev,
                                                        [action.id]: {
                                                            name: prev[action.id]?.name ?? action.name,
                                                            isAvailable: checked,
                                                        },
                                                    }));
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => updateAction(action.id)}>
                                                    Mettre a jour
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => deleteAction(action.id)}
                                                >
                                                    Supprimer
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
