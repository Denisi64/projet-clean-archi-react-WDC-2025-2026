import { Module } from "@nestjs/common";
import { TransfersController } from "./transfers.controller";
import { TransferBetweenAccountsUseCase } from "@proj/application/accounts/TransferBetweenAccountsUseCase";
import { ListTransfersForUserUseCase } from "@proj/application/accounts/ListTransfersForUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { ClientRoleGuard } from "../common/client-role.guard";
import { createTransferRepository, createUserQueryRepository } from "@proj/infra";

@Module({
    controllers: [TransfersController],
    providers: [
        {
            provide: "TokenVerifier",
            useFactory: () => new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "UserQueryRepository",
            useFactory: () => createUserQueryRepository(),
        },
        {
            provide: "TransferRepository",
            useFactory: () => createTransferRepository(),
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
