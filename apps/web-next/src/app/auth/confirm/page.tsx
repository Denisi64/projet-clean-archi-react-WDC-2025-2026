"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Status = "idle" | "loading" | "success" | "error";

export default function ConfirmPage() {
    const t = useTranslations("confirm");
    const search = useSearchParams();
    const token = search.get("token");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        async function run() {
            if (!token) {
                setStatus("error");
                setMessage(t("tokenMissing"));
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
                    setMessage(t("success"));
                } else {
                    const payload = await res.json().catch(() => ({}));
                    const code = payload?.code;
                    if (code === "CONFIRMATION_TOKEN_EXPIRED") {
                        setMessage(t("tokenExpired"));
                    } else if (code === "CONFIRMATION_TOKEN_INVALID") {
                        setMessage(t("tokenInvalid"));
                    } else {
                        setMessage(t("genericError"));
                    }
                    setStatus("error");
                }
            } catch (e: any) {
                setStatus("error");
                setMessage(t("networkError"));
            }
        }
        run();
    }, [token, t]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-3">
                <h1 className="text-xl font-semibold">{t("title")}</h1>
                {status === "loading" && <p className="text-sm text-gray-600">{t("loading")}</p>}
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
                        {t("login")}
                    </a>
                )}
            </div>
        </main>
    );
}
