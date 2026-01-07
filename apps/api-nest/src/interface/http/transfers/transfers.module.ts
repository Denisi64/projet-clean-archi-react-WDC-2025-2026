import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { TransfersController } from "./transfers.controller";
import { TransferBetweenAccountsUseCase } from "@proj/application/accounts/TransferBetweenAccountsUseCase";
import { PrismaTransferRepository } from "@proj/infra/accounts/PrismaTransferRepository";
import { ListTransfersForUserUseCase } from "@proj/application/accounts/ListTransfersForUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { ClientRoleGuard } from "../common/client-role.guard";

@Module({
    controllers: [TransfersController],
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
            provide: "TransferRepository",
            useFactory: (prisma: PrismaClient) => new PrismaTransferRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: TransferBetweenAccountsUseCase,
            useFactory: (repo) => new TransferBetweenAccountsUseCase(repo),
            inject: ["TransferRepository"],
        },
        {
            provide: ListTransfersForUserUseCase,
            useFactory: (repo) => new ListTransfersForUserUseCase(repo),
            inject: ["TransferRepository"],
        },
        ClientRoleGuard,
    ],
})
export class TransfersModule {}
