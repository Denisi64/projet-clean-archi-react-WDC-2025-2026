"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastItem = { id: string; message: string };

type ToastContextValue = {
    pushToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function nextId() {
    return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const t = useTranslations("toast");
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const pushToast = useCallback((message: string) => {
        const id = nextId();
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000);
    }, []);

    const value = useMemo(() => ({ pushToast }), [pushToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toasts.length > 0 && (
                <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs space-y-2">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={cn(
                                "pointer-events-auto rounded-md border border-primary/40 bg-background/95 px-4 py-3 shadow-lg",
                                "backdrop-blur supports-[backdrop-filter]:bg-background/70",
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-1 text-sm text-foreground">{toast.message}</div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setToasts((prev) => prev.filter((item) => item.id !== toast.id))
                                    }
                                    className="h-6 px-2 text-xs"
                                >
                                    {t("close")}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return ctx;
}
