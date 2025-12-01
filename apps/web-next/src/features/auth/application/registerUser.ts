// apps/web-next/src/features/auth/application/registerUser.ts

export type RegisterUserInput = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
};

export type RegisterUserResult = {
    ok: boolean;
    confirmationExpiresAt?: string;
};

export async function registerUser(
    payload: RegisterUserInput,
): Promise<RegisterUserResult> {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let message = 'Inscription impossible';
        try {
            const data = await res.json();
            if (data?.code === 'EMAIL_ALREADY_USED') message = 'Email déjà utilisé.';
            else if (data?.message) {
                message = Array.isArray(data.message)
                    ? data.message.join(', ')
                    : data.message;
            } else if (data?.code) {
                message = data.code;
            }
        } catch {
            // rien
        }
        throw new Error(message);
    }

    const data = (await res.json()) as RegisterUserResult;
    return data;
}
