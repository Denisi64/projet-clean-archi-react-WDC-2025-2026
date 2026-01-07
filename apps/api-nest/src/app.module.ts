import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { HealthController } from "./health/health.controller";
import { AccountsModule } from "./interface/http/accounts/accounts.module";
import { ActionsModule } from "./interface/http/actions/actions.module";
import { AdminAccountsModule } from "./interface/http/admin-accounts/admin-accounts.module";
import { AdminUsersModule } from "./interface/http/admin-users/admin-users.module";
import { AuthModule } from "./interface/http/auth/auth.module";
import { CreditsModule } from "./interface/http/credits/credits.module";
import { SavingsModule } from "./interface/http/savings/savings.module";
import { TransfersModule } from "./interface/http/transfers/transfers.module";
import { UsersModule } from "./interface/http/users/users.module";
@Module({
    imports: [
        AuthModule,
        AccountsModule,
        TransfersModule,
        CreditsModule,
        ActionsModule,
        SavingsModule,
        UsersModule,
        AdminUsersModule,
        AdminAccountsModule,
    ],
    controllers: [AppController, HealthController],
})
export class AppModule {}
