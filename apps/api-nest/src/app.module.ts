import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { AuthModule } from "./interface/http/auth/auth.module";
@Module({
    imports: [AuthModule],
    controllers: [AppController, HealthController]

})
export class AppModule {}
