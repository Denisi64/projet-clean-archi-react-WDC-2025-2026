"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select-native";

const schema = z.object({
    name: z.string().trim().min(2, "Le nom du compte est requis (2 caractères minimum)."),
    type: z.enum(["CURRENT", "SAVINGS"]),
});
type FormData = z.infer<typeof schema>;

export function AccountCreator() {
    const router = useRouter();
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

    async function onSubmit(data: FormData) {
        const res = await fetch("/api/accounts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
        }).catch(() => null);

        if (!res) {
            setError("root", { type: "server", message: "Impossible de créer le compte." });
            return;
        }

        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            setError("root", { type: "server", message: payload?.code ?? "Impossible de créer le compte." });
            return;
        }

        reset({ name: "", type: data.type });
        router.refresh();
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
                <Label htmlFor="name">Nom du compte</Label>
                <Input
                    id="name"
                    name="name"
                    {...register("name")}
                    placeholder="Ex: Compte Perso"
                />
                {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select id="type" {...register("type")}>
                    <option value="CURRENT">Courant</option>
                    <option value="SAVINGS">Épargne</option>
                </Select>
            </div>

            {errors.root && <p className="text-sm font-medium text-destructive">{errors.root.message}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Création..." : "Ajouter un compte"}
            </Button>
        </form>
    );
}
