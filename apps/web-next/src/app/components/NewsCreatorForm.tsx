"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export function NewsCreatorForm() {
    const t = useTranslations("newsCreator");
    const schema = useMemo(
        () =>
            z.object({
                title: z.string().trim().min(2, t("titleRequired")),
                body: z.string().trim().max(2000).optional(),
            }),
        [t],
    );

    type FormData = z.infer<typeof schema>;
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { title: "", body: "" },
    });

    const submit = async (data: FormData) => {
        const payload = {
            title: data.title.trim(),
            body: data.body?.trim() || null,
        };

        const resp = await fetch("/api/news", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
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
        reset({ title: "", body: "" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>{t("titleLabel")}</Label>
                        <Input {...register("title")} placeholder={t("titlePlaceholder")} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("bodyLabel")}</Label>
                        <Input {...register("body")} placeholder={t("bodyPlaceholder")} />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("sending") : t("send")}
                    </Button>
                    {errors.root?.type === "server" && (
                        <div className="text-sm text-destructive">
                            {t("errorPrefix")} {errors.root.message}
                        </div>
                    )}
                    {errors.root?.type === "success" && (
                        <div className="text-sm text-emerald-600">{errors.root.message}</div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
