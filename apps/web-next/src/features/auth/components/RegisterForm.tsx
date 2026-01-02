'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
    registerUser,
    RegisterUserInput,
} from '@/features/auth/application/registerUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type RegisterFormProps = {
    onSuccessRedirectTo?: string; // ex: '/dashboard'
};

export function RegisterForm({ onSuccessRedirectTo = "/" }: RegisterFormProps) {
    const t = useTranslations("register");
    const locale = useLocale();
    const intlLocale = locale === "en" ? "en-US" : "fr-FR";
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const payload: RegisterUserInput = {
            firstName: (formData.get('firstName') as string)?.trim(),
            lastName: (formData.get('lastName') as string)?.trim(),
            email: (formData.get('email') as string)?.trim(),
            password: formData.get('password') as string,
        };

        try {
            const { confirmationExpiresAt } = await registerUser(payload);
            const eta = confirmationExpiresAt
                ? new Date(confirmationExpiresAt).toLocaleString(intlLocale)
                : null;
            setSuccess(
                eta
                    ? t("successWithDate", { eta })
                    : t("success"),
            );
            if (onSuccessRedirectTo) {
                router.prefetch(onSuccessRedirectTo);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t("error"));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">{t("title")}</CardTitle>
                <CardDescription className="text-center">
                    {t("subtitle")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t("firstName")}</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                autoComplete="given-name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t("lastName")}</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                autoComplete="family-name"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">{t("password")}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t("passwordHint")}
                        </p>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("submitting") : t("submit")}
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-center text-muted-foreground w-full">
                    {t("already")}{" "}
                    <Link href="/login" className="underline hover:text-primary">
                        {t("login")}
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
