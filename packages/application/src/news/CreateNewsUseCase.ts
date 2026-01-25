import { Result, err, ok } from "../Result";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";
import { CreateNewsInput, NewsRepository } from "@proj/domain/news/ports/NewsRepository";

type Input = {
    actorRole: UserRole;
    actorId: string;
    title: string;
    body?: string | null;
};

type Output = {
    id: string;
    createdAt: Date;
};

type UseCaseError = ForbiddenRoleError | Error;

export class CreateNewsUseCase {
    constructor(private readonly repo: NewsRepository) {}

    async execute(input: Input): Promise<Result<Output, UseCaseError>> {
        if (input.actorRole !== "ADVISOR") {
            return err(new ForbiddenRoleError());
        }

        const created = await this.repo.create({
            title: input.title,
            body: input.body ?? null,
            createdById: input.actorId,
        } satisfies CreateNewsInput);

        return ok({ id: created.id, createdAt: created.createdAt });
    }
}
