import { Module } from '@nestjs/common';
import { AdminAccountsController } from './admin-accounts.controller';
import { CreateAccountForUserUseCase } from '@proj/application/accounts/CreateAccountForUserUseCase';
import { RenameAccountUseCase } from '@application/src/accounts/RenameAccountUseCase';
import { CloseAccountUseCase } from '@proj/application/accounts/CloseAccountUseCase';
import { GetUserAccountsUseCase } from '@proj/application/accounts/GetUserAccountsUseCase';
import { JwtTokenVerifier } from '@proj/infra/auth/JwtTokenVerifier';
import { DirectorRoleGuard } from '../common/director-role.guard';
import {
  createAccountRepository,
  createUserQueryRepository,
} from '@proj/infra';

@Module({
  controllers: [AdminAccountsController],
  providers: [
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
      provide: 'AccountRepository',
      useFactory: () => createAccountRepository(),
    },
    {
      provide: CreateAccountForUserUseCase,
      useFactory: (repo) => new CreateAccountForUserUseCase(repo),
      inject: ['AccountRepository'],
    },
    {
      provide: GetUserAccountsUseCase,
      useFactory: (repo) => new GetUserAccountsUseCase(repo),
      inject: ['AccountRepository'],
    },
    {
      provide: RenameAccountUseCase,
      useFactory: (repo) => new RenameAccountUseCase(repo),
      inject: ['AccountRepository'],
    },
    {
      provide: CloseAccountUseCase,
      useFactory: (repo) => new CloseAccountUseCase(repo),
      inject: ['AccountRepository'],
    },
    DirectorRoleGuard,
  ],
})
export class AdminAccountsModule {}
