import LoginForm from "@/features/auth/components/LoginForm";

export const metadata = {
    title: "Connexion – Avenir Bank",
    description: "Accédez à votre espace client.",
};

export default function LoginPage() {
    return (
        <main className="mx-auto max-w-md p-6">
            <LoginForm />
            <p className="mt-4 text-sm"><a href="/reset">Mot de passe oublié ?</a></p>
        </main>
    );
}
