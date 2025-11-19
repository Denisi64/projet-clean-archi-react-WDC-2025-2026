'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    registerUser,
    RegisterUserInput,
} from '@/features/auth/application/registerUser';

type RegisterFormProps = {
    onSuccessRedirectTo?: string; // ex: '/dashboard'
};

export function RegisterForm({ onSuccessRedirectTo = '/' }: RegisterFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const payload: RegisterUserInput = {
            firstName: (formData.get('firstName') as string)?.trim(),
            lastName: (formData.get('lastName') as string)?.trim(),
            email: (formData.get('email') as string)?.trim(),
            password: formData.get('password') as string,
        };

        try {
            const { accessToken, user } = await registerUser(payload);

            // TODO: branche ton système d'auth global ici
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('accessToken', accessToken);
                window.localStorage.setItem('currentUser', JSON.stringify(user));
            }

            router.push(onSuccessRedirectTo);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Une erreur est survenue.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 border rounded-2xl p-6 shadow-sm bg-white"
        >
            <h1 className="text-2xl font-semibold text-center">
                Créer un compte
            </h1>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    {error}
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="firstName">
                        Prénom
                    </label>
                    <input
                        id="firstName"
                        name="firstName"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        autoComplete="given-name"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="lastName">
                        Nom
                    </label>
                    <input
                        id="lastName"
                        name="lastName"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        autoComplete="family-name"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    autoComplete="email"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1" htmlFor="password">
                    Mot de passe
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    autoComplete="new-password"
                    required
                    minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 caractères.
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
                {loading ? "Création du compte..." : "S'inscrire"}
            </button>

            <p className="text-xs text-center text-gray-500">
                Déjà un compte ?{' '}
                <a href="/login" className="underline">
                    Se connecter
                </a>
            </p>
        </form>
    );
}
