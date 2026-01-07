import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { UsersController } from "./users.controller";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";

@Module({
    controllers: [UsersController],
    providers: [
        PrismaClient,
        {
            provide: "TokenVerifier",
            useFactory: () => new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "UserQueryRepository",
            useFactory: (prisma: PrismaClient) => new PrismaUserQueryRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: SearchUsersUseCase,
            useFactory: (repo) => new SearchUsersUseCase(repo),
            inject: ["UserQueryRepository"],
        },
        AdvisorRoleGuard,
    ],
})
export class UsersModule {}
