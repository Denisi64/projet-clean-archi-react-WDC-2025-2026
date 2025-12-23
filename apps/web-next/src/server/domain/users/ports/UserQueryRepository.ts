export type UserMinimal = {
    id: string;
    email: string;
    name: string;
};

export type UserRole = "CLIENT" | "ADVISOR" | "DIRECTOR";

export interface UserQueryRepository {
    search(query: string): Promise<UserMinimal[]>;
    getRoleById(userId: string): Promise<UserRole | null>;
}
