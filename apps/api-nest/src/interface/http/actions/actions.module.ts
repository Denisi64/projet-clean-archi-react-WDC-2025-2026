import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ActionsController } from "./actions.controller";
import { AdminActionsController } from "../admin-actions/admin-actions.controller";
import { PrismaActionRepository } from "@proj/infra/actions/PrismaActionRepository";
import { PrismaPortfolioRepository } from "@proj/infra/actions/PrismaPortfolioRepository";
import { PrismaActionTradeRepository } from "@proj/infra/actions/PrismaActionTradeRepository";
import { ListActionsUseCase } from "@proj/application/actions/ListActionsUseCase";
import { CreateActionUseCase } from "@proj/application/actions/CreateActionUseCase";
import { UpdateActionUseCase } from "@proj/application/actions/UpdateActionUseCase";
import { DeleteActionUseCase } from "@proj/application/actions/DeleteActionUseCase";
import { BuyActionUseCase } from "@proj/application/actions/BuyActionUseCase";
import { SellActionUseCase } from "@proj/application/actions/SellActionUseCase";
import { GetPortfolioUseCase } from "@proj/application/actions/GetPortfolioUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { ClientRoleGuard } from "../common/client-role.guard";
import { DirectorRoleGuard } from "../common/director-role.guard";
import { NotificationsGateway } from "../../websocket/notifications.gateway";
import { SocketActionStockNotifier } from "../../../infrastructure/services/SocketActionStockNotifier";

@Module({
    controllers: [ActionsController, AdminActionsController],
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
            provide: "ActionRepository",
            useFactory: (prisma: PrismaClient) => new PrismaActionRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "PortfolioRepository",
            useFactory: (prisma: PrismaClient) => new PrismaPortfolioRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "ActionTradeRepository",
            useFactory: (prisma: PrismaClient) => new PrismaActionTradeRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "ActionStockNotifier",
            useFactory: (gateway: NotificationsGateway) => new SocketActionStockNotifier(gateway),
            inject: [NotificationsGateway],
        },
        {
            provide: ListActionsUseCase,
            useFactory: (repo) => new ListActionsUseCase(repo),
            inject: ["ActionRepository"],
        },
        {
            provide: CreateActionUseCase,
            useFactory: (repo) => new CreateActionUseCase(repo),
            inject: ["ActionRepository"],
        },
        {
            provide: UpdateActionUseCase,
            useFactory: (repo) => new UpdateActionUseCase(repo),
            inject: ["ActionRepository"],
        },
        {
            provide: DeleteActionUseCase,
            useFactory: (repo) => new DeleteActionUseCase(repo),
            inject: ["ActionRepository"],
        },
        {
            provide: BuyActionUseCase,
            useFactory: (actionRepo, portfolioRepo, tradeRepo, notifier) =>
                new BuyActionUseCase(actionRepo, portfolioRepo, tradeRepo, notifier),
            inject: ["ActionRepository", "PortfolioRepository", "ActionTradeRepository", "ActionStockNotifier"],
        },
        {
            provide: SellActionUseCase,
            useFactory: (actionRepo, portfolioRepo, tradeRepo, notifier) =>
                new SellActionUseCase(actionRepo, portfolioRepo, tradeRepo, notifier),
            inject: ["ActionRepository", "PortfolioRepository", "ActionTradeRepository", "ActionStockNotifier"],
        },
        {
            provide: GetPortfolioUseCase,
            useFactory: (portfolioRepo) => new GetPortfolioUseCase(portfolioRepo),
            inject: ["PortfolioRepository"],
        },
        ClientRoleGuard,
        DirectorRoleGuard,
    ],
})
export class ActionsModule {}
