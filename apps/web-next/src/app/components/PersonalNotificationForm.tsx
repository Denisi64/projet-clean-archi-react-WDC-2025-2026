"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { useTranslations } from "next-intl";

export function PersonalNotificationForm() {
    const t = useTranslations("personalNotifications");
    const schema = useMemo(
        () =>
            z.object({
                userId: z.string().trim().min(1, t("userIdRequired")),
                title: z.string().trim().min(2, t("titleRequired")),
                body: z.string().trim().max(1000).optional(),
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
        setValue,
        watch,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { userId: "", title: "", body: "" },
    });

    const userId = watch("userId");
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
    const [searching, setSearching] = useState(false);

    const searchUsers = async (q: string) => {
        setSearching(true);
        try {
            const resp = await fetch(`/api/advisor/users?query=${encodeURIComponent(q)}`);
            if (!resp.ok) {
                setUsers([]);
                return;
            }
            const data = await resp.json().catch(() => null);
            const list = (data?.users ?? []).map((u: any) => ({
                id: u.id,
                label: `${u.name} <${u.email}>`,
            }));
            setUsers(list);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const handle = setTimeout(() => searchUsers(query), 200);
        return () => clearTimeout(handle);
    }, [query]);

    useEffect(() => {
        searchUsers("");
    }, []);

    useEffect(() => {
        if (!userId && users.length > 0) {
            setValue("userId", users[0].id);
        }
    }, [users, userId, setValue]);

    const submit = async (data: FormData) => {
        const payload = {
            userId: data.userId.trim(),
            title: data.title.trim(),
            body: data.body?.trim() || null,
        };

        const resp = await fetch("/api/notifications/personal", {
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
        reset({ userId: "", title: "", body: "" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>{t("searchLabel")}</Label>
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                        />
                        {searching && <p className="text-sm text-muted-foreground">{t("searching")}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("userIdLabel")}</Label>
                        <Select {...register("userId")}>
                            <option value="">{t("selectPlaceholder")}</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.label}
                                </option>
                            ))}
                        </Select>
                        {users.length === 0 && <p className="text-sm text-destructive">{t("noUsers")}</p>}
                        {errors.userId && <p className="text-sm text-destructive">{errors.userId.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>{t("notifTitleLabel")}</Label>
                        <Input {...register("title")} placeholder={t("notifTitlePlaceholder")} />
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
