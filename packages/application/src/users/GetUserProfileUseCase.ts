import { Result, err, ok } from "../Result";
import { UserProfile, UserQueryRepository } from "@proj/domain/users/ports/UserQueryRepository";

type Output = UserProfile | null;

export class GetUserProfileUseCase {
    constructor(private readonly repo: UserQueryRepository) {}

    async execute(userId: string): Promise<Result<Output, Error>> {
        try {
            const profile = await this.repo.getProfileById(userId);
            return ok(profile);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("USER_PROFILE_READ_FAILED"));
        }
    }
}
