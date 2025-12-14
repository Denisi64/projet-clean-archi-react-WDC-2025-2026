export type UserMinimal = {
    id: string;
    email: string;
    name: string;
};

export interface UserQueryRepository {
    search(query: string): Promise<UserMinimal[]>;
}
