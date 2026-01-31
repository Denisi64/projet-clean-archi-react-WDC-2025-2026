import { Module } from '@nestjs/common';
import { SavingsController } from './savings.controller';
import { ApplyDailySavingsInterestUseCase } from '@proj/application/accounts/ApplyDailySavingsInterestUseCase';
import { PrismaInterestRateProvider } from '@proj/infra/accounts/PrismaInterestRateProvider';
import { UpdateSavingsRateUseCase } from '@proj/application/accounts/UpdateSavingsRateUseCase';
import { GetActiveSavingsRateUseCase } from '@proj/application/accounts/GetActiveSavingsRateUseCase';
import { NotificationsGateway } from '../../websocket/notifications.gateway';
import { SocketSavingsRateNotifier } from '../../../infrastructure/services/SocketSavingsRateNotifier';
import { JwtTokenVerifier } from '@proj/infra/auth/JwtTokenVerifier';
import { DirectorRoleGuard } from '../common/director-role.guard';
import { PrismaClient } from '@prisma/client';
import { resolveDbDriver } from '@proj/infra';
import {
  createSavingsInterestRepository,
  createSavingsRateRepository,
  createUserQueryRepository,
} from '@proj/infra';

@Module({
  controllers: [SavingsController],
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
      provide: 'SavingsInterestRepository',
      useFactory: () => createSavingsInterestRepository(),
    },
    {
      provide: 'SavingsRateRepository',
      useFactory: () => createSavingsRateRepository(),
    },
    {
      provide: 'InterestRateProvider',
      useFactory: (rateRepo) => new PrismaInterestRateProvider(rateRepo),
      inject: ['SavingsRateRepository'],
    },
    {
      provide: ApplyDailySavingsInterestUseCase,
      useFactory: (repo, rateProvider) =>
        new ApplyDailySavingsInterestUseCase(repo, rateProvider),
      inject: ['SavingsInterestRepository', 'InterestRateProvider'],
    },
    {
      provide: UpdateSavingsRateUseCase,
      useFactory: (rateRepo, notifier) =>
        new UpdateSavingsRateUseCase(rateRepo, notifier),
      inject: ['SavingsRateRepository', 'SavingsRateNotifier'],
    },
    {
      provide: 'SavingsRateNotifier',
      useFactory: (gateway: NotificationsGateway) => {
        const driver = resolveDbDriver();
        const prisma = driver === 'postgres' ? new PrismaClient() : null;
        return new SocketSavingsRateNotifier(prisma, gateway);
      },
      inject: [NotificationsGateway],
    },
    {
      provide: GetActiveSavingsRateUseCase,
      useFactory: (rateRepo) => new GetActiveSavingsRateUseCase(rateRepo),
      inject: ['SavingsRateRepository'],
    },
    DirectorRoleGuard,
  ],
})
export class SavingsModule {}
