import { Module, forwardRef } from '@nestjs/common';

// Ports
import { ConversationRepository } from './application/chat/ports/ConversationRepository';
import { MessageRepository } from './application/chat/ports/MessageRepository';
import { ChatEventsPort } from './application/chat/ports/ChatEventsPort';

// Prisma
import { PrismaService } from './infrastructure/database/PrismaService';
import { PrismaConversationRepository } from './infrastructure/chat/repositories/PrismaConversationRepository';
import { PrismaMessageRepository } from './infrastructure/chat/repositories/PrismaMessageRepository';

// Events Adapter WebSocket
import { SocketIoChatEventsAdapter } from './infrastructure/chat/SocketIoChatEventsAdapter';

// Use Cases
import { SendClientMessageUseCase } from './application/chat/usercases/SendClientMessageUseCase';
import { SendAdvisorMessageUseCase } from './application/chat/usercases/SendAdvisorMessageUseCase';
import { AssignConversationUseCase } from './application/chat/usercases/AssignConversationUseCase';
import { TransferConversationUseCase } from './application/chat/usercases/TransferConversationUseCase';
import { CreateConversationUseCase } from './application/chat/usercases/CreateConversationUseCase';

// Gateways
import { ChatGateway } from './interface/websocket/chat.gateway';

// Controllers (REST)
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { NotificationsController } from './interface/http/notification/notifications.controller';

// Auth Module
import { AuthModule } from './interface/http/auth/auth.module';

// Database Module
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule, AuthModule],
    controllers: [AppController, HealthController, NotificationsController],
    providers: [
        // Repositories
        {
            provide: 'ConversationRepository',
            useClass: PrismaConversationRepository,
        },
        {
            provide: 'MessageRepository',
            useClass: PrismaMessageRepository,
        },

        // Events Adapter - needs forwardRef because it depends on ChatGateway
        {
            provide: 'ChatEventsPort',
            useFactory: (gateway: ChatGateway) =>
                new SocketIoChatEventsAdapter(gateway),
            inject: [forwardRef(() => ChatGateway)],
        },

        // Use Cases
        {
            provide: SendClientMessageUseCase,
            useFactory: (conversations, messages, events) =>
                new SendClientMessageUseCase(conversations, messages, events),
            inject: [
                'ConversationRepository',
                'MessageRepository',
                'ChatEventsPort',
            ],
        },
        {
            provide: SendAdvisorMessageUseCase,
            useFactory: (conversations, messages, events) =>
                new SendAdvisorMessageUseCase(conversations, messages, events),
            inject: [
                'ConversationRepository',
                'MessageRepository',
                'ChatEventsPort',
            ],
        },
        {
            provide: AssignConversationUseCase,
            useFactory: (conversations, events) =>
                new AssignConversationUseCase(conversations, events),
            inject: ['ConversationRepository', 'ChatEventsPort'],
        },
        {
            provide: TransferConversationUseCase,
            useFactory: (conversations, events) =>
                new TransferConversationUseCase(conversations, events),
            inject: ['ConversationRepository', 'ChatEventsPort'],
        },
        {
            provide: CreateConversationUseCase,
            useFactory: (conversations) =>
                new CreateConversationUseCase(conversations),
            inject: ['ConversationRepository'],
        },

        ChatGateway,
    ],
})
export class AppModule {
    constructor() {
        console.log('✅ AppModule initialized');
    }
}
