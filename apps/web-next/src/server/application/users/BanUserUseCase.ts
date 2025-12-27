import { UserAdminRepository, BannedUser } from "../../domain/users/ports/UserAdminRepository";
import { Result, err, ok } from "../Result";

export class BanUserUseCase {
    constructor(private readonly repo: UserAdminRepository) {}

    async execute(userId: string): Promise<Result<BannedUser, Error>> {
        try {
            const user = await this.repo.banUser(userId);
            return ok(user);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("USER_BAN_FAILED"));
        }
    }
}
