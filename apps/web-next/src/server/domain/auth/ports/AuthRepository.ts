export type AuthUser = {
    id: string;
    email: string;
    passwordHash: string;
};

export type CreateUserInput = {
    email: string;
    passwordHash: string;
    name?: string;
};

export interface AuthRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    createUser(data: CreateUserInput): Promise<AuthUser>;
}
