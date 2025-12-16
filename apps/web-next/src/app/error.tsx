"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({ reset }: { reset: () => void }) {
    return (
        <html>
            <body>
                <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-6 text-center">
                    <div className="max-w-md space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold">Une erreur est survenue</h1>
                        <p className="text-muted-foreground">
                            Un incident technique est survenu. Vous pouvez réessayer ou revenir à l’accueil.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={reset}
                                className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Réessayer
                            </button>
                            <Link
                                href="/"
                                className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                            >
                                Accueil
                            </Link>
                        </div>
                    </div>
                </main>
            </body>
        </html>
    );
}
