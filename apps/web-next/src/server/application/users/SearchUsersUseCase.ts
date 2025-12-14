import { UserQueryRepository } from "../../domain/users/ports/UserQueryRepository";

export class SearchUsersUseCase {
    constructor(private readonly repo: UserQueryRepository) {}

    async execute(query: string) {
        const q = query.trim();
        if (q.length < 2) return [];
        return this.repo.search(q);
    }
}
