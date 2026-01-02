"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type FetchState = "idle" | "loading" | "error";

export function SavingsRateCard() {
    const t = useTranslations("savingsRateCard");
    const router = useRouter();
    const [fetchState, setFetchState] = useState<FetchState>("loading");
    const [success, setSuccess] = useState<string | null>(null);
    const schema = useMemo(
        () =>
            z.object({
                ratePercent: z.coerce
                    .number()
                    .positive(t("ratePositive"))
                    .max(50, t("rateMax")),
            }),
        [t],
    );
    type FormData = z.infer<typeof schema>;
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        setError,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { ratePercent: 0 },
    });

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
                setValue("ratePercent", data.ratePercent !== null ? data.ratePercent : 0);
                setFetchState("idle");
            }
        }

        loadRate();
        return () => {
            canceled = true;
        };
    }, [setValue]);

    async function onSubmit(data: FormData) {
        setSuccess(null);

        const res = await fetch("/api/admin/savings/rate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ratePercent: data.ratePercent }),
        }).catch(() => null);

        if (!res) {
            setError("root", { type: "server", message: t("serverError") });
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError("root", { type: "server", message: data?.code ?? t("serverError") });
            return;
        }

        setSuccess(t("success"));
        router.refresh();
    }

    const isLoading = fetchState === "loading";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-1">
                        <Label htmlFor="rate">{t("rateLabel")}</Label>
                        <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            min={0.01}
                            max={50}
                            {...register("ratePercent")}
                            disabled={isLoading || isSubmitting}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || isSubmitting}>
                        {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                    {errors.ratePercent && <p className="text-sm text-destructive">{errors.ratePercent.message}</p>}
                    {errors.root && (
                        <p className="text-sm text-destructive">
                            {t("errorPrefix")} {errors.root.message}
                        </p>
                    )}
                    {success && <p className="text-sm text-emerald-600">{success}</p>}
                </form>
            </CardContent>
        </Card>
    );
}
