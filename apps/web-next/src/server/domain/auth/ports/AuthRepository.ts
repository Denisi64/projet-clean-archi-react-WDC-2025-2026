export type AuthUser = {
    id: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    name?: string;
    role?: string;
    confirmationToken?: string | null;
    confirmationTokenExpiresAt?: Date | null;
};

export type CreateUserInput = {
    email: string;
    passwordHash: string;
    name?: string;
    isActive?: boolean;
    confirmationToken?: string | null;
    confirmationTokenExpiresAt?: Date | null;
};

export interface AuthRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    findById(id: string): Promise<AuthUser | null>;
    createUser(data: CreateUserInput): Promise<AuthUser>;
    findByConfirmationToken(token: string): Promise<AuthUser | null>;
    confirmUser(userId: string): Promise<void>;
}
