import { getTranslations } from "next-intl/server";

export default async function BannedPage() {
    const t = await getTranslations("banned");
    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
            <div className="max-w-xl rounded-lg border bg-card p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold">{t("title")}</h1>
                <p className="mt-4 text-muted-foreground">
                    {t("body")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t("hint")}
                </p>
            </div>
        </main>
    );
}
