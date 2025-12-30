import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatEventsPort } from '../../application/chat/ports/ChatEventsPort';
import { ChatGateway } from '../../interface/websocket/chat.gateway';

@Injectable()
export class SocketIoChatEventsAdapter implements ChatEventsPort {
    constructor(
        @Inject(forwardRef(() => ChatGateway))
        private readonly gateway: ChatGateway,
    ) {}

    async newMessage(payload: { conversationId: string; message: any }) {
        this.gateway.server
            .to(`conversation:${payload.conversationId}`)
            .emit('chat:message', payload.message);
    }

    async conversationAssigned(payload: {
        conversationId: string;
        advisorId: string;
    }) {
        this.gateway.server
            .to(`advisor:${payload.advisorId}`)
            .emit('conversation:assigned', payload);
    }

    async conversationTransferred(payload: {
        conversationId: string;
        fromAdvisorId: string;
        toAdvisorId: string;
    }) {
        this.gateway.server
            .to(`advisor:${payload.toAdvisorId}`)
            .emit('conversation:transferred', payload);
    }
}
