import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations("registerPage");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
            <RegisterForm onSuccessRedirectTo="/" />
        </main>
    );
}
