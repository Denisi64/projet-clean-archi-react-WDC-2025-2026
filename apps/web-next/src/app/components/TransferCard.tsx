"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type Account = {
    id: string;
    iban: string;
    name: string;
};

export default function TransferCard({ accounts }: { accounts: Account[] }) {
    const t = useTranslations("transferCard");
    const router = useRouter();
    const schema = useMemo(
        () =>
            z.object({
                sourceAccountId: z.string().min(1, t("sourceRequired")),
                destinationIban: z.string().trim().min(5, t("ibanRequired")),
                amount: z.coerce.number().positive(t("amountInvalid")),
                note: z.string().trim().optional(),
            }),
        [t],
    );
    type FormData = z.infer<typeof schema>;
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
            setError("root", { type: "server", message: t("serverError") });
            return;
        }
        if (!resp.ok) {
            const resData = await resp.json().catch(() => null);
            setError("root", { type: "server", message: resData?.code ?? t("serverError") });
            return;
        }

        setError("root", { type: "success", message: t("success") });
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
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>{t("sourceLabel")}</Label>
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
                        <Label>{t("destinationLabel")}</Label>
                        <Input {...register("destinationIban")} />
                        {errors.destinationIban && (
                            <p className="text-sm text-destructive">{errors.destinationIban.message}</p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("amountLabel")}</Label>
                        <Input type="number" step="0.01" {...register("amount")} />
                        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("noteLabel")}</Label>
                        <Input {...register("note")} />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                    {error && (
                        <div className="text-sm text-destructive">
                            {t("errorPrefix")} {error}
                        </div>
                    )}
                    {message && <div className="text-sm text-emerald-600">{message}</div>}
                </form>
            </CardContent>
        </Card>
    );
}
