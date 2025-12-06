"use client";

import { FormEvent, useState } from "react";
import styles from "../page.module.css";
import { Field } from "../design/atoms/Field";
import { Input } from "../design/atoms/Input";
import { Select } from "../design/atoms/Select";
import { Button } from "../design/atoms/Button";

export function AccountCreator() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const form = new FormData(e.currentTarget);
        const rawName = (form.get("name") as string)?.trim() ?? "";
        const name = rawName.length >= 2 ? rawName : undefined;
        const type = (form.get("type") as string) === "SAVINGS" ? "SAVINGS" : "CURRENT";

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name, type }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.code ?? "Impossible de créer le compte.");
                return;
            }

            window.location.reload();
        } catch (err) {
            setError("Impossible de créer le compte.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <Field label="Nom du compte" htmlFor="name">
                <Input id="name" name="name" placeholder="Ex: Compte Perso" />
            </Field>
            <Field label="Type" htmlFor="type">
                <Select id="type" name="type" defaultValue="CURRENT">
                    <option value="CURRENT">Courant</option>
                    <option value="SAVINGS">Épargne</option>
                </Select>
            </Field>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Ajouter un compte"}
            </Button>
        </form>
    );
}
