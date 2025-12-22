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

const schema = z.object({
    name: z.string().trim().min(2, "Le nom du compte est requis."),
    type: z.enum(["CURRENT", "SAVINGS"]),
});
type FormData = z.infer<typeof schema>;

export default function AccountCreatorCard() {
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

    const submit = async (data: FormData) => {
        const resp = await fetch("/api/accounts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data),
        }).catch(() => null);

        if (!resp) {
            setError("root", { type: "server", message: "UNEXPECTED_ERROR" });
            return;
        }
        if (!resp.ok) {
            const resData = await resp.json().catch(() => null);
            setError("root", { type: "server", message: resData?.code ?? "UNEXPECTED_ERROR" });
            return;
        }

        setError("root", { type: "success", message: "Compte créé" });
        reset({ name: "", type: data.type });
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ajouter un compte</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-3" onSubmit={handleSubmit(submit)}>
                    <div className="space-y-1">
                        <Label>Nom</Label>
                        <Input {...register("name")} placeholder="Mon compte" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <Select {...register("type")}>
                            <option value="CURRENT">Compte courant</option>
                            <option value="SAVINGS">Épargne</option>
                        </Select>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Création..." : "Créer"}
                    </Button>
                    {errors.root?.type === "server" && (
                        <div className="text-sm text-destructive">Erreur : {errors.root.message}</div>
                    )}
                    {errors.root?.type === "success" && (
                        <div className="text-sm text-emerald-600">{errors.root.message}</div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
