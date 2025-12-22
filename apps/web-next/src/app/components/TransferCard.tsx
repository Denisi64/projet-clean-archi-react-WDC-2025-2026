"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Account = {
    id: string;
    iban: string;
    name: string;
};

const schema = z.object({
    sourceAccountId: z.string().min(1, "Compte source requis"),
    destinationIban: z.string().trim().min(5, "IBAN requis"),
    amount: z.coerce.number().positive("Montant invalide"),
    note: z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

export default function TransferCard({ accounts }: { accounts: Account[] }) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
        setError,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            sourceAccountId: accounts[0]?.id ?? "",
            destinationIban: "",
            amount: 0,
            note: "",
        },
    });
    const sourceAccountId = watch("sourceAccountId");
    const message = errors.root?.type === "success" ? errors.root.message : null;
    const error = errors.root?.type === "server" ? errors.root.message : null;

    useEffect(() => {
        if (accounts.length === 0) return;
        const exists = accounts.some((account) => account.id === sourceAccountId);
        if (!exists) {
            setValue("sourceAccountId", accounts[0]?.id ?? "");
        }
    }, [accounts, setValue, sourceAccountId]);

    const submit = async (data: FormData) => {
        const resp = await fetch("/api/transfers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...data,
                destinationIban: data.destinationIban.trim(),
                note: data.note?.trim() || undefined,
            }),
        }).catch(() => null);

        if (!resp) {
            setError("root", { type: "server", message: "UNEXPECTED_ERROR" });
            return;
        }
        if (!resp.ok) {
            const resData = await resp.json().catch(() => null);
            setError("root", { type: "server", message: resData?.code ?? "UNEXPECTED_ERROR" });
            return;
        }

        setError("root", { type: "success", message: "Transfert effectué" });
        reset({
            sourceAccountId: data.sourceAccountId,
            destinationIban: "",
            amount: 0,
            note: "",
        });
        router.refresh();
    };

    if (accounts.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Effectuer un transfert</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>Compte source</Label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...register("sourceAccountId")}
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.iban})
                                </option>
                            ))}
                        </select>
                        {errors.sourceAccountId && (
                            <p className="text-sm text-destructive">{errors.sourceAccountId.message}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>IBAN destination (interne)</Label>
                        <Input {...register("destinationIban")} />
                        {errors.destinationIban && (
                            <p className="text-sm text-destructive">{errors.destinationIban.message}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Montant</Label>
                        <Input type="number" step="0.01" {...register("amount")} />
                        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>Note</Label>
                        <Input {...register("note")} />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Transfert..." : "Transférer"}
                    </Button>
                    {error && <div className="text-sm text-destructive">Erreur : {error}</div>}
                    {message && <div className="text-sm text-emerald-600">{message}</div>}
                </form>
            </CardContent>
        </Card>
    );
}
