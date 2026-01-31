import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatApplicationModule } from '../../websocket/chat-application.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ChatApplicationModule, AuthModule],
  controllers: [ChatController],
})
export class ChatHttpModule {}
