"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { login } from "../application/login.command";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox-native";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";

export default function LoginForm() {
    const t = useTranslations("login");
    const schema = z.object({
        email: z.string().email(t("emailInvalid")),
        password: z.string().min(8, t("passwordMin")),
        remember: z.boolean().optional(),
    });
    type FormData = z.infer<typeof schema>;

    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

    useEffect(() => { fetch("/api/auth/csrf"); }, []);

    async function onSubmit(data: FormData) {
        setError(null);
        try {
            await login(data);
            window.location.assign("/");
        } catch (e: any) {
            if (e?.message === "INVALID_CREDENTIALS") {
                setError(t("invalidCredentials"));
            } else if (e?.message === "ACCOUNT_INACTIVE") {
                setError(t("inactiveAccount"));
            } else if (e?.message === "ACCOUNT_BANNED") {
                setError(t("bannedAccount"));
            } else {
                setError(t("genericError"));
            }
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">{t("title")}</CardTitle>
                <CardDescription>
                    {t("description")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            {...register("email")}
                        />
                        {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t("password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register("password")}
                        />
                        {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" {...register("remember")} />
                        <Label htmlFor="remember" className="font-normal cursor-pointer">
                            {t("remember")}
                        </Label>
                    </div>
                    {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? t("loggingIn") : t("login")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
