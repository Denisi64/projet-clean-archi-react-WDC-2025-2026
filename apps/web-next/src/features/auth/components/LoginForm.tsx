"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { login } from "../application/login.command";

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
            setError(e?.message === "INVALID_CREDENTIALS" ? "Identifiants invalides." : "Erreur. Réessayez.");
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <div>
                <label className="block text-sm font-medium" htmlFor="email">Email</label>
                <input id="email" type="email" {...register("email")} className="input input-bordered w-full" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium" htmlFor="password">Mot de passe</label>
                <input id="password" type="password" {...register("password")} className="input input-bordered w-full" />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <label className="inline-flex items-center gap-2">
                <input type="checkbox" {...register("remember")} />
                <span>Se souvenir de moi</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button disabled={isSubmitting} className="btn w-full">
                {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
        </form>
    );
}
