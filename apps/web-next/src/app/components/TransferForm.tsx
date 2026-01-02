"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select-native";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("transferForm");
    const options = useMemo(
        () => accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.iban})` })),
        [accounts],
    );
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
        setError,
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            sourceAccountId: accounts[0]?.id ?? "",
            destinationIban: "",
            amount: 0,
            note: "",
        },
    });

    async function onSubmit(data: FormData) {
        const res = await fetch("/api/transfers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...data,
                destinationIban: data.destinationIban.trim(),
                note: data.note?.trim() || undefined,
            }),
        }).catch(() => null);

        if (!res) {
            setError("root", { type: "server", message: t("transferError") });
            return;
        }

        if (!res.ok) {
            const dataRes = await res.json().catch(() => ({}));
            setError("root", {
                type: "server",
                message: dataRes?.code ?? t("transferError"),
            });
            return;
        }

        reset({
            sourceAccountId: data.sourceAccountId,
            destinationIban: "",
            amount: 0,
            note: "",
        });
        window.location.reload();
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
                <Label htmlFor="source">{t("sourceLabel")}</Label>
                <Select id="source" {...register("sourceAccountId")}>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
                {errors.sourceAccountId && (
                    <p className="text-sm font-medium text-destructive">{errors.sourceAccountId.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="destination">{t("destinationLabel")}</Label>
                <Input
                    id="destination"
                    placeholder={t("destinationPlaceholder")}
                    {...register("destinationIban")}
                />
                {errors.destinationIban && (
                    <p className="text-sm font-medium text-destructive">{errors.destinationIban.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">{t("amountLabel")}</Label>
                <Input id="amount" placeholder={t("amountPlaceholder")} {...register("amount")} />
                {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="note">{t("noteLabel")}</Label>
                <Input id="note" placeholder={t("notePlaceholder")} {...register("note")} />
            </div>

            {errors.root && <p className="text-sm font-medium text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? t("submitting") : t("submit")}
            </Button>
        </form>
    );
}
