"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { login } from "../application/login.command";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox-native";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";

const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
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
                setError("Identifiants invalides.");
            } else if (e?.message === "ACCOUNT_INACTIVE") {
                setError("Compte non confirmé. Consulte tes emails.");
            } else {
                setError("Erreur. Réessayez.");
            }
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Connexion</CardTitle>
                <CardDescription>
                    Entrez vos identifiants pour accéder à votre espace.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="exemple@email.com"
                            {...register("email")}
                        />
                        {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
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
                            Se souvenir de moi
                        </Label>
                    </div>
                    {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Connexion..." : "Se connecter"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
