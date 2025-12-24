import { UserAdminRepository, BannedUser } from "../../domain/users/ports/UserAdminRepository";

export class BanUserUseCase {
    constructor(private readonly repo: UserAdminRepository) {}

    async execute(userId: string): Promise<BannedUser> {
        return this.repo.banUser(userId);
    }
}
