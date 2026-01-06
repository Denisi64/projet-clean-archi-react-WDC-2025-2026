export type BannedUser = { id: string; bannedAt: Date };

export interface UserAdminRepository {
    banUser(userId: string): Promise<BannedUser>;
}
