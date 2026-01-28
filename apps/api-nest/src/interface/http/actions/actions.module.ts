import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { AdminActionsController } from '../admin-actions/admin-actions.controller';
import { ListActionsUseCase } from '@proj/application/actions/ListActionsUseCase';
import { CreateActionUseCase } from '@proj/application/actions/CreateActionUseCase';
import { UpdateActionUseCase } from '@proj/application/actions/UpdateActionUseCase';
import { DeleteActionUseCase } from '@proj/application/actions/DeleteActionUseCase';
import { BuyActionUseCase } from '@proj/application/actions/BuyActionUseCase';
import { SellActionUseCase } from '@proj/application/actions/SellActionUseCase';
import { GetPortfolioUseCase } from '@proj/application/actions/GetPortfolioUseCase';
import { JwtTokenVerifier } from '@proj/infra/auth/JwtTokenVerifier';
import { ClientRoleGuard } from '../common/client-role.guard';
import { DirectorRoleGuard } from '../common/director-role.guard';
import { NotificationsGateway } from '../../websocket/notifications.gateway';
import { SocketActionStockNotifier } from '../../../infrastructure/services/SocketActionStockNotifier';
import {
  createActionRepository,
  createActionTradeRepository,
  createPortfolioRepository,
  createUserQueryRepository,
} from '@proj/infra';

@Module({
  controllers: [ActionsController, AdminActionsController],
  providers: [
    NotificationsGateway,
    {
      provide: 'TokenVerifier',
      useFactory: () =>
        new JwtTokenVerifier(process.env.JWT_SECRET ?? 'dev-secret'),
    },
    {
      provide: 'UserQueryRepository',
      useFactory: () => createUserQueryRepository(),
    },
    {
      provide: 'ActionRepository',
      useFactory: () => createActionRepository(),
    },
    {
      provide: 'PortfolioRepository',
      useFactory: () => createPortfolioRepository(),
    },
    {
      provide: 'ActionTradeRepository',
      useFactory: () => createActionTradeRepository(),
    },
    {
      provide: 'ActionStockNotifier',
      useFactory: (gateway: NotificationsGateway) =>
        new SocketActionStockNotifier(gateway),
      inject: [NotificationsGateway],
    },
    {
      provide: ListActionsUseCase,
      useFactory: (repo) => new ListActionsUseCase(repo),
      inject: ['ActionRepository'],
    },
    {
      provide: CreateActionUseCase,
      useFactory: (repo) => new CreateActionUseCase(repo),
      inject: ['ActionRepository'],
    },
    {
      provide: UpdateActionUseCase,
      useFactory: (repo) => new UpdateActionUseCase(repo),
      inject: ['ActionRepository'],
    },
    {
      provide: DeleteActionUseCase,
      useFactory: (repo) => new DeleteActionUseCase(repo),
      inject: ['ActionRepository'],
    },
    {
      provide: BuyActionUseCase,
      useFactory: (actionRepo, portfolioRepo, tradeRepo, notifier) =>
        new BuyActionUseCase(actionRepo, portfolioRepo, tradeRepo, notifier),
      inject: [
        'ActionRepository',
        'PortfolioRepository',
        'ActionTradeRepository',
        'ActionStockNotifier',
      ],
    },
    {
      provide: SellActionUseCase,
      useFactory: (actionRepo, portfolioRepo, tradeRepo, notifier) =>
        new SellActionUseCase(actionRepo, portfolioRepo, tradeRepo, notifier),
      inject: [
        'ActionRepository',
        'PortfolioRepository',
        'ActionTradeRepository',
        'ActionStockNotifier',
      ],
    },
    {
      provide: GetPortfolioUseCase,
      useFactory: (portfolioRepo) => new GetPortfolioUseCase(portfolioRepo),
      inject: ['PortfolioRepository'],
    },
    ClientRoleGuard,
    DirectorRoleGuard,
  ],
})
export class ActionsModule {}
