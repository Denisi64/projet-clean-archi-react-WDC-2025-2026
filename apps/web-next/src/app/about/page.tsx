import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "../i18n";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const baseTitle = "À propos — Avenir Bank";
const baseDescription =
    "Découvrez la vision produit, la sécurité et l’architecture Clean d’Avenir Bank, plateforme bancaire en ligne pensée pour la fiabilité et la transparence.";

export const metadata: Metadata = {
    title: baseTitle,
    description: baseDescription,
    alternates: { canonical: "/about" },
    keywords: [
        "banque en ligne",
        "avenir bank",
        "comptes courants",
        "épargne",
        "sécurité",
        "clean architecture",
        "nextjs",
        "nestjs",
    ],
    openGraph: {
        title: baseTitle,
        description: baseDescription,
        url: "/about",
        siteName: "Avenir Bank",
        locale: "fr_FR",
        type: "article",
    },
};

type Locale = "fr" | "en";

const copy: Record<
    Locale,
    {
        hero: { title: string; subtitle: string; cta: string };
        mission: { title: string; items: string[] };
        architecture: { title: string; content: string };
        security: { title: string; items: string[] };
        performance: { title: string; items: string[] };
    }
> = {
    fr: {
        hero: {
            title: "Avenir Bank, la banque en ligne conçue pour durer",
            subtitle:
                "Une plateforme Next.js + NestJS, structurée en Clean Architecture pour garantir fiabilité, sécurité et évolutivité.",
            cta: "Revenir à l’accueil",
        },
        mission: {
            title: "Notre mission",
            items: [
                "Transparence : des parcours clairs pour ouvrir, gérer et clôturer vos comptes.",
                "Sécurité : chiffrement des sessions, mots de passe hashés et contrôle strict des accès.",
                "Évolutivité : une architecture modulaire pour ajouter produits et services rapidement.",
            ],
        },
        architecture: {
            title: "Architecture",
            content:
                "Domain et Use Cases indépendants des frameworks, adaptateurs Prisma pour Postgres/MariaDB, et API unifiées côté Nest et Next pour un déploiement flexible.",
        },
        security: {
            title: "Sécurité & conformité",
            items: [
                "Sessions signées (JWT), mots de passe hashés via PasswordHasher.",
                "Validation systématique des données (zod / ValidationPipe).",
                "Règles métier d’activation : un compte inactif ne peut pas se connecter.",
            ],
        },
        performance: {
            title: "Performance & SEO",
            items: [
                "Rendu serveur prioritaire, routes optimisées pour le cache et la revalidation.",
                "Metadata SEO complètes (title, description, Open Graph).",
                "Sitemap prévu pour exposer les pages clés aux moteurs de recherche.",
            ],
        },
    },
    en: {
        hero: {
            title: "Avenir Bank, built to last",
            subtitle:
                "A Next.js + NestJS platform shaped by Clean Architecture to ensure reliability, security, and scalability.",
            cta: "Back to home",
        },
        mission: {
            title: "Our mission",
            items: [
                "Transparency: clear journeys to open, manage, and close your accounts.",
                "Security: encrypted sessions, hashed passwords, and strict access control.",
                "Scalability: modular architecture to ship new products quickly.",
            ],
        },
        architecture: {
            title: "Architecture",
            content:
                "Domain and use cases isolated from frameworks, Prisma adapters for Postgres/MariaDB, unified APIs on Nest and Next for flexible deployments.",
        },
        security: {
            title: "Security & compliance",
            items: [
                "Signed sessions (JWT), passwords hashed via PasswordHasher.",
                "Systematic data validation (zod / ValidationPipe).",
                "Activation rules: inactive accounts cannot log in.",
            ],
        },
        performance: {
            title: "Performance & SEO",
            items: [
                "Server-first rendering, routes tuned for cache and revalidation.",
                "Complete SEO metadata (title, description, Open Graph).",
                "Sitemap planned to expose key pages to search engines.",
            ],
        },
    },
};

export const revalidate = 3600;

export default function AboutPage({ searchParams }: { searchParams?: { lang?: string } }) {
    const locale = getLocale(searchParams?.lang) as Locale;
    const t = copy[locale];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <section className="container mx-auto px-4 py-14 md:py-18">
                <div className="max-w-3xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-primary">Avenir Bank</p>
                    <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t.hero.title}</h1>
                    <p className="text-lg text-muted-foreground md:text-xl">{t.hero.subtitle}</p>
                    <div className="pt-4">
                        <Link href="/" className={buttonVariants({ size: "lg" })}>
                            {t.hero.cta}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container mx-auto grid gap-6 px-4 pb-16 md:grid-cols-2 md:pb-24">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t.mission.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {t.mission.items.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t.architecture.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="leading-relaxed text-muted-foreground">{t.architecture.content}</p>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t.security.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {t.security.items.map((item) => (
                                <li key={item} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>{t.performance.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-muted-foreground">
                            {t.performance.items.map((item) => (
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
