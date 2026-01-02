"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

export default function AccountCreatorCard() {
    const t = useTranslations("accountCreatorCard");
    const router = useRouter();
    const schema = useMemo(
        () =>
            z.object({
                name: z.string().trim().min(2, t("nameRequired")),
                type: z.enum(["CURRENT", "SAVINGS"]),
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
        defaultValues: { name: "", type: "CURRENT" },
    });

    const submit = async (data: FormData) => {
        const resp = await fetch("/api/accounts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
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

        setError("root", { type: "success", message: t("createOk") });
        reset({ name: "", type: data.type });
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>{t("name")}</Label>
                        <Input {...register("name")} placeholder={t("namePlaceholder")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("type")}</Label>
                        <Select {...register("type")}>
                            <option value="CURRENT">{t("typeCurrent")}</option>
                            <option value="SAVINGS">{t("typeSavings")}</option>
                        </Select>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("creating") : t("create")}
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
