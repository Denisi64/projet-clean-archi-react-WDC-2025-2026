import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
            <RegisterForm onSuccessRedirectTo="/" />
        </main>
    );
}
