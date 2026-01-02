import LoginForm from "@/features/auth/components/LoginForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations("loginPage");
    return {
        title: t("title"),
        description: t("description"),
    };
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
            <LoginForm />
        </main>
    );
}
