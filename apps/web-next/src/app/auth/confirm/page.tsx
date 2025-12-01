"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function ConfirmPage() {
    const search = useSearchParams();
    const token = search.get("token");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        async function run() {
            if (!token) {
                setStatus("error");
                setMessage("Token manquant dans l'URL.");
                return;
            }
            setStatus("loading");
            setMessage("");
            try {
                const res = await fetch("/api/auth/confirm", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                if (res.ok) {
                    setStatus("success");
                    setMessage("Votre compte est confirmé. Vous pouvez vous connecter.");
                } else {
                    const payload = await res.json().catch(() => ({}));
                    const code = payload?.code;
                    if (code === "CONFIRMATION_TOKEN_EXPIRED") {
                        setMessage("Le lien a expiré. Demandez un nouvel e-mail.");
                    } else if (code === "CONFIRMATION_TOKEN_INVALID") {
                        setMessage("Lien de confirmation invalide.");
                    } else {
                        setMessage("Impossible de confirmer le compte pour le moment.");
                    }
                    setStatus("error");
                }
            } catch (e: any) {
                setStatus("error");
                setMessage("Erreur réseau. Réessayez.");
            }
        }
        run();
    }, [token]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-3">
                <h1 className="text-xl font-semibold">Confirmation du compte</h1>
                {status === "loading" && <p className="text-sm text-gray-600">Validation en cours...</p>}
                {status === "success" && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-md p-3">
                        {message}
                    </p>
                )}
                {status === "error" && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-3">
                        {message}
                    </p>
                )}
                {status === "success" && (
                    <a href="/login" className="inline-flex justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50">
                        Se connecter
                    </a>
                )}
            </div>
        </main>
    );
}
