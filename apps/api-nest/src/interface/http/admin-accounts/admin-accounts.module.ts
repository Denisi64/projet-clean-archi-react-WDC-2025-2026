import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AdminAccountsController } from "./admin-accounts.controller";
import { PrismaAccountRepository } from "@proj/infra/accounts/PrismaAccountRepository";
import { CreateAccountForUserUseCase } from "@proj/application/accounts/CreateAccountForUserUseCase";
import { RenameAccountUseCase } from "@proj/application/accounts/RenameAccountUseCase";
import { CloseAccountUseCase } from "@proj/application/accounts/CloseAccountUseCase";
import { GetUserAccountsUseCase } from "@proj/application/accounts/GetUserAccountsUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { DirectorRoleGuard } from "../common/director-role.guard";

@Module({
    controllers: [AdminAccountsController],
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
            provide: "AccountRepository",
            useFactory: (prisma: PrismaClient) => new PrismaAccountRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: CreateAccountForUserUseCase,
            useFactory: (repo) => new CreateAccountForUserUseCase(repo),
            inject: ["AccountRepository"],
        },
        {
            provide: GetUserAccountsUseCase,
            useFactory: (repo) => new GetUserAccountsUseCase(repo),
            inject: ["AccountRepository"],
        },
        {
            provide: RenameAccountUseCase,
            useFactory: (repo) => new RenameAccountUseCase(repo),
            inject: ["AccountRepository"],
        },
        {
            provide: CloseAccountUseCase,
            useFactory: (repo) => new CloseAccountUseCase(repo),
            inject: ["AccountRepository"],
        },
        DirectorRoleGuard,
    ],
})
export class AdminAccountsModule {}
