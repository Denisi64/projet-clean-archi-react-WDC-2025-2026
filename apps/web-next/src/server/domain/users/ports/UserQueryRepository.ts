export type UserMinimal = {
    id: string;
    email: string;
    name: string;
};

export type UserRole = "CLIENT" | "ADVISOR" | "DIRECTOR";
export type UserAccess = { role: UserRole; bannedAt: Date | null };

export interface UserQueryRepository {
    search(query: string): Promise<UserMinimal[]>;
    getRoleById(userId: string): Promise<UserRole | null>;
    getAccessById(userId: string): Promise<UserAccess | null>;
}
