import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
            <RegisterForm onSuccessRedirectTo="/" />
        </main>
    );
}
