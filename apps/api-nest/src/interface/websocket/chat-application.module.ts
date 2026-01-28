import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthModule } from '../interface/http/auth/auth.module';
import { ChatGateway } from '../interface/websocket/chat.gateway';

import {
  DISCUSSION_REPOSITORY,
  MESSAGE_REPOSITORY,
  CHAT_EVENTS_PORT,
  ADVISOR_REPOSITORY,
} from '@packages/application/src/chat/tokens';

import {
  SendClientMessageUseCase,
  SendAdvisorMessageUseCase,
  AssignDiscussionUseCase,
  TransferDiscussionUseCase,
  CreateDiscussionUseCase,
  GetPendingDiscussionsUseCase,
  GetDiscussionMessagesUseCase,
  GetAdvisorsUseCase,
  CloseDiscussionUseCase,
  GetDiscussionUseCase,
} from '@packages/application/src/chat';

import { PrismaDiscussionRepository } from '../infrastructure/chat/repositories/PrismaDiscussionRepository';
import { PrismaMessageRepository } from '../infrastructure/chat/repositories/PrismaMessageRepository';
import { PrismaAdvisorRepository } from '../infrastructure/auth/repositories/PrismaAdvisorRepository';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    {
      provide: DISCUSSION_REPOSITORY,
      useClass: PrismaDiscussionRepository,
    },
    { provide: MESSAGE_REPOSITORY, useClass: PrismaMessageRepository },
    { provide: ADVISOR_REPOSITORY, useClass: PrismaAdvisorRepository },

    ChatGateway,
    { provide: CHAT_EVENTS_PORT, useExisting: ChatGateway },

    SendClientMessageUseCase,
    SendAdvisorMessageUseCase,
    AssignDiscussionUseCase,
    TransferDiscussionUseCase,
    CreateDiscussionUseCase,
    GetPendingDiscussionsUseCase,
    GetDiscussionMessagesUseCase,
    GetAdvisorsUseCase,
    CloseDiscussionUseCase,
    GetDiscussionUseCase,
  ],
})
export class ChatModule {}
