import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { SavingsController } from "./savings.controller";
import { PrismaSavingsInterestRepository } from "@proj/infra/accounts/PrismaSavingsInterestRepository";
import { ApplyDailySavingsInterestUseCase } from "@proj/application/accounts/ApplyDailySavingsInterestUseCase";
import { PrismaSavingsRateRepository } from "@proj/infra/accounts/PrismaSavingsRateRepository";
import { PrismaInterestRateProvider } from "@proj/infra/accounts/PrismaInterestRateProvider";
import { UpdateSavingsRateUseCase } from "@proj/application/accounts/UpdateSavingsRateUseCase";
import { GetActiveSavingsRateUseCase } from "@proj/application/accounts/GetActiveSavingsRateUseCase";
import { NotificationsGateway } from "../../websocket/notifications.gateway";
import { SocketSavingsRateNotifier } from "../../../infrastructure/services/SocketSavingsRateNotifier";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { DirectorRoleGuard } from "../common/director-role.guard";

@Module({
    controllers: [SavingsController],
    providers: [
        PrismaClient,
        NotificationsGateway,
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
            provide: "SavingsInterestRepository",
            useFactory: (prisma: PrismaClient) => new PrismaSavingsInterestRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "SavingsRateRepository",
            useFactory: (prisma: PrismaClient) => new PrismaSavingsRateRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "InterestRateProvider",
            useFactory: (rateRepo) => new PrismaInterestRateProvider(rateRepo),
            inject: ["SavingsRateRepository"],
        },
        {
            provide: ApplyDailySavingsInterestUseCase,
            useFactory: (repo, rateProvider) =>
                new ApplyDailySavingsInterestUseCase(repo, rateProvider),
            inject: ["SavingsInterestRepository", "InterestRateProvider"],
        },
        {
            provide: UpdateSavingsRateUseCase,
            useFactory: (rateRepo, notifier) => new UpdateSavingsRateUseCase(rateRepo, notifier),
            inject: ["SavingsRateRepository", "SavingsRateNotifier"],
        },
        {
            provide: "SavingsRateNotifier",
            useFactory: (prisma: PrismaClient, gateway: NotificationsGateway) =>
                new SocketSavingsRateNotifier(prisma, gateway),
            inject: [PrismaClient, NotificationsGateway],
        },
        {
            provide: GetActiveSavingsRateUseCase,
            useFactory: (rateRepo) => new GetActiveSavingsRateUseCase(rateRepo),
            inject: ["SavingsRateRepository"],
        },
        DirectorRoleGuard,
    ],
})
export class SavingsModule {}
