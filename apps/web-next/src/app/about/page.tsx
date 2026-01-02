import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("aboutMeta");
    const locale = await getLocale();
    const ogLocale = locale === "en" ? "en_US" : "fr_FR";

    return {
        title: t("title"),
        description: t("description"),
        alternates: { canonical: "/about" },
        keywords: t.raw("keywords") as string[],
        openGraph: {
            title: t("title"),
            description: t("description"),
            url: "/about",
            siteName: t("siteName"),
            locale: ogLocale,
            type: "article",
        },
    };
}

export const revalidate = 3600;

export default async function AboutPage() {
    const t = await getTranslations("about");
    const missionItems = t.raw("mission.items") as string[];
    const securityItems = t.raw("security.items") as string[];
    const performanceItems = t.raw("performance.items") as string[];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="container mx-auto px-4 py-14 md:py-18">
                <div className="max-w-3xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-primary">
                        {t("brand")}
                    </p>
                    <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                        {t("hero.title")}
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl">
                        {t("hero.subtitle")}
                    </p>
                    <div className="pt-4">
                        <Link href="/" className={buttonVariants({ size: "lg" })}>
                            {t("hero.cta")}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container mx-auto grid gap-6 px-4 pb-16 md:grid-cols-2 md:pb-24">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t("mission.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {missionItems.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t("architecture.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="leading-relaxed text-muted-foreground">
                            {t("architecture.content")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t("security.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {securityItems.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t("performance.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {performanceItems.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
