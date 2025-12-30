import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SendClientMessageUseCase } from '../../application/chat/usercases/SendClientMessageUseCase';
import { SendAdvisorMessageUseCase } from '../../application/chat/usercases/SendAdvisorMessageUseCase';
import { AssignConversationUseCase } from '../../application/chat/usercases/AssignConversationUseCase';
import { TransferConversationUseCase } from '../../application/chat/usercases/TransferConversationUseCase';

@WebSocketGateway({
    cors: { origin: 'http://localhost:3000', credentials: true },
    namespace: '/chat',
})
export class ChatGateway {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly sendClientMessage: SendClientMessageUseCase,
        private readonly sendAdvisorMessage: SendAdvisorMessageUseCase,
        private readonly assignConversation: AssignConversationUseCase,
        private readonly transferConversation: TransferConversationUseCase,
    ) {}

    handleConnection(client: Socket) {
        console.log('Client connected:', client.id);
    }

    @SubscribeMessage('join')
    async join(
        @MessageBody() body: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`conversation:${body.conversationId}`);
    }

    @SubscribeMessage('client:send')
    async clientSend(
        @MessageBody() body: any,
        @ConnectedSocket() client: Socket,
    ) {
        await this.sendClientMessage.execute({
            clientId: client.data.userId,
            conversationId: body.conversationId,
            content: body.content,
        });
    }

    @SubscribeMessage('advisor:send')
    async advisorSend(
        @MessageBody() body: any,
        @ConnectedSocket() client: Socket,
    ) {
        await this.sendAdvisorMessage.execute({
            advisorId: client.data.userId,
            conversationId: body.conversationId,
            content: body.content,
        });
    }

    @SubscribeMessage('conversation:assign')
    async assign(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
        await this.assignConversation.execute({
            advisorId: client.data.userId,
            conversationId: body.conversationId,
        });
    }

    @SubscribeMessage('conversation:transfer')
    async transfer(
        @MessageBody() body: any,
        @ConnectedSocket() client: Socket,
    ) {
        await this.transferConversation.execute({
            fromAdvisorId: client.data.userId,
            toAdvisorId: body.toAdvisorId,
            conversationId: body.conversationId,
        });
    }
}
