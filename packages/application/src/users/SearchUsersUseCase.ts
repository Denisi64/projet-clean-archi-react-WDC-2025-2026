import { UserQueryRepository, UserMinimal } from "@proj/domain/users/ports/UserQueryRepository";
import { Result, err, ok } from "../Result";

export class SearchUsersUseCase {
    constructor(private readonly repo: UserQueryRepository) {}

    async execute(query: string): Promise<Result<UserMinimal[], Error>> {
        const trimmed = query.trim();
        const searchValue = trimmed.length < 2 ? "" : trimmed;
        try {
            const users = await this.repo.search(searchValue);
            return ok(users);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("USERS_SEARCH_FAILED"));
        }
    }
}
