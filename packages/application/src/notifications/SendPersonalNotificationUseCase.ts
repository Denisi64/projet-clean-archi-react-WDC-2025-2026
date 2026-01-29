import { Result, err, ok } from "../Result";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";
import {
    NotificationRepository,
    NotificationSnapshot,
} from "@proj/domain/notifications/ports/NotificationRepository";
import { NotificationStream } from "@proj/domain/notifications/ports/NotificationStream";

type Input = {
    actorRole: UserRole;
    userId: string;
    title: string;
    body?: string | null;
};

type Output = {
    notificationId: string;
    createdAt: Date;
};

type UseCaseError = ForbiddenRoleError | Error;

export class SendPersonalNotificationUseCase {
    constructor(
        private readonly repo: NotificationRepository,
        private readonly stream: NotificationStream,
    ) {}

    async execute(input: Input): Promise<Result<Output, UseCaseError>> {
        if (!this.canSend(input.actorRole)) {
            return err(new ForbiddenRoleError());
        }

        const snapshot = await this.repo.create({
            userId: input.userId,
            title: input.title,
            body: input.body ?? null,
        });

        this.stream.publishToUser(input.userId, this.toEvent(snapshot));

        return ok({
            notificationId: snapshot.id,
            createdAt: snapshot.createdAt,
        });
    }

    private canSend(role: UserRole): boolean {
        return role === "ADVISOR" || role === "DIRECTOR";
    }

    private toEvent(snapshot: NotificationSnapshot) {
        return {
            id: snapshot.id,
            title: snapshot.title,
            body: snapshot.body ?? null,
            createdAt: snapshot.createdAt.toISOString(),
        };
    }
}
