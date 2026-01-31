import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ModuleRef } from '@nestjs/core';

import { SendClientMessageUseCase } from '@proj/application/chat/SendClientMessageUseCase';
import { SendAdvisorMessageUseCase } from '@proj/application/chat/SendAdvisorMessageUseCase';
import { AssignDiscussionUseCase } from '@proj/application/chat/AssignDiscussionUseCase';
import { TransferDiscussionUseCase } from '@proj/application/chat/TransferDiscussionUseCase';
import { ChatEventsPort } from '../../application/chat/ports/ChatEventsPort';

import { CloseDiscussionUseCase } from '@proj/application/chat/CloseDiscussionUseCase';
import { JwtTokenVerifier } from '@proj/infra/auth/JwtTokenVerifier';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class ChatGateway implements ChatEventsPort {
  @WebSocketServer()
  server!: Server;

  private sendClientMessage!: SendClientMessageUseCase;
  private sendAdvisorMessage!: SendAdvisorMessageUseCase;
  private assignDiscussion!: AssignDiscussionUseCase;
  private transferDiscussion!: TransferDiscussionUseCase;
  private closeDiscussionUseCase!: CloseDiscussionUseCase;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly jwt: JwtTokenVerifier,
  ) {}

  afterInit() {
    this.sendClientMessage = this.moduleRef.get(SendClientMessageUseCase, {
      strict: false,
    });
    this.sendAdvisorMessage = this.moduleRef.get(SendAdvisorMessageUseCase, {
      strict: false,
    });
    this.assignDiscussion = this.moduleRef.get(AssignDiscussionUseCase, {
      strict: false,
    });
    this.transferDiscussion = this.moduleRef.get(
      TransferDiscussionUseCase,
      { strict: false },
    );
    this.closeDiscussionUseCase = this.moduleRef.get(
      CloseDiscussionUseCase,
      {
        strict: false,
      },
    );
  }

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      client.disconnect();
      return;
    }

    const sessionCookie = cookieHeader
      .split('; ')
      .find((c) => c.startsWith('session='));

    if (!sessionCookie) {
      client.disconnect();
      return;
    }

    const token = sessionCookie.split('=')[1];

    try {
      const payload = this.jwt.verify(token);

      client.data.user = {
        id: payload.sub,
        role: payload.role,
      };

      if (client.data.user.role === 'ADVISOR') {
        client.join('advisors');
        client.join(`advisor:${payload.sub}`);
      }
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  join(
    @MessageBody() body: { discussionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`discussion:${body.discussionId}`);
  }

  @SubscribeMessage('client:send')
  async clientSend(
    @MessageBody() body: { discussionId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.sendClientMessage.execute({
      ownerId: client.data.user.id,
      discussionId: body.discussionId,
      content: body.content,
    });
  }

  @SubscribeMessage('advisor:send')
  async advisorSend(
    @MessageBody() body: { discussionId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (client.data.user.role !== 'ADVISOR') {
      throw new WsException('Forbidden');
    }

    await this.sendAdvisorMessage.execute({
      advisorId: client.data.user.id,
      discussionId: body.discussionId,
      content: body.content,
    });
  }

  @SubscribeMessage('discussion:assign')
  async assign(
    @MessageBody() body: { discussionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.assignDiscussion.execute({
      advisorId: client.data.user.id,
      discussionId: body.discussionId,
    });
  }

  @SubscribeMessage('discussion:transfer')
  async transfer(
    @MessageBody() body: { discussionId: string; toAdvisorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.transferDiscussion.execute({
      fromAdvisorId: client.data.user.id,
      toAdvisorId: body.toAdvisorId,
      discussionId: body.discussionId,
    });
  }

  async discussionAssigned(payload: {
    discussionId: string;
    advisorId: string;
  }) {
    await this.server.to(`advisors`).emit('discussion.assigned', payload);

    await this.server.to('advisors').emit('discussion.removed', {
      discussionId: payload.discussionId,
    });
  }

  async newMessage(payload: {
    discussionId: string;
    message: any;
  }): Promise<void> {
    await this.server
      .to(`discussion:${payload.discussionId}`)
      .emit('chat:message', payload.message);
  }

  async discussionTransferred(payload: {
    discussionId: string;
    fromAdvisorId: string;
    toAdvisorId: string;
  }): Promise<void> {
    await this.server.to(`advisors`).emit('discussion.removed', {
      discussionId: payload.discussionId,
    });

    await this.server
      .to(`advisor:${payload.toAdvisorId}`)
      .emit('discussion.assigned', {
        discussionId: payload.discussionId,
        advisorId: payload.toAdvisorId,
      });
  }

  @SubscribeMessage('discussion:close')
  async closeDiscussion(
    @MessageBody() body: { discussionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.closeDiscussionUseCase.execute({
      advisorId: client.data.user.id,
      discussionId: body.discussionId,
    });
  }

  async discussionClosed(payload: {
    discussionId: string;
    advisorId: string;
  }) {
    await this.server.to('advisors').emit('discussion.removed', {
      discussionId: payload.discussionId,
    });

    await this.server
      .to(`advisor:${payload.advisorId}`)
      .emit('discussion.closed', payload);
  }
}
