// apps/web-next/src/features/auth/application/registerUser.ts

export type RegisterUserInput = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
};

export type AuthUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    // ajoute d'autres champs si ton backend en renvoie (role, etc.)
};

export type RegisterUserResult = {
    accessToken: string;
    user: AuthUser;
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
        let message = 'Registration failed';
        try {
            const data = await res.json();
            if (data?.message) {
                message = Array.isArray(data.message)
                    ? data.message.join(', ')
                    : data.message;
            }
        } catch {
            // rien
        }
        throw new Error(message);
    }

    const data = (await res.json()) as RegisterUserResult;
    return data;
}
