import {
  Controller,
  Get,
  Param,
  Req,
  ForbiddenException,
  NotFoundException,
  UseGuards,
  Post,
} from '@nestjs/common';
import { Request } from 'express';

import {
  DiscussionNotFound,
  ForbiddenDiscussionAccess,
} from '../../../../../../packages/domain/src/chat/error/errors';

// import { GetPendingDiscussionsUseCase } from '../../../application/chat/usercases/GetPendingDiscussionsUseCase';
import { GetPendingDiscussionsUseCase } from '../../../../../../packages/application/src/chat/GetPendingDiscussionsUseCase';
import { GetDiscussionMessagesUseCase } from '../../../../../../packages/application/src/chat/GetDiscussionMessagesUseCase';
import { GetAdvisorsUseCase } from '../../../../../../packages/application/src/chat/GetAdvisorsUseCase';
import { GetDiscussionUseCase } from '../../../../../../packages/application/src/chat/GetDiscussionUseCase';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CreateDiscussionUseCase } from '../../../../../../packages/application/src/chat/CreateDiscussionUseCase';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR';
  };
};

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly getPendingDiscussion: GetPendingDiscussionUseCase,
    private readonly getDiscussionMessages: GetDiscussionMessagesUseCase,
    private readonly getAdvisors: GetAdvisorsUseCase,
    private readonly getDiscussionUseCase: GetDiscussionUseCase,
    private readonly createDiscussion: CreateDiscussionUseCase,
  ) {}

  @UseGuards(JwtHttpAuthGuard)
  @Get('advisors')
  advisors() {
    return this.getAdvisors.execute();
  }

  @UseGuards(JwtHttpAuthGuard)
  @Get('advisor/pending')
  getPending() {
    return this.getPendingDiscussion.execute();
  }

  @UseGuards(JwtHttpAuthGuard)
  @Get('discussion/:discussionId/messages')
  async getDiscussionMessagesHandler(
    @Param('discussionId') discussionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      return await this.getDiscussionMessages.execute({
        discussionId,
        userId: req.user.id,
        role: req.user.role,
      });
    } catch (error) {
      if (error instanceof DiscussionNotFound) {
        throw new NotFoundException();
      }

      if (error instanceof ForbiddenDiscussionAccess) {
        throw new ForbiddenException();
      }

      throw error;
    }
  }

  @UseGuards(JwtHttpAuthGuard)
  @Get('discussion/:id')
  getDiscussion(
    @Param('id') discussionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getDiscussionUseCase.execute({
      discussionId,
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @UseGuards(JwtHttpAuthGuard)
  @Post('discussion')
  create(@Req() req: AuthenticatedRequest) {
    return this.createDiscussion.execute({
      ownerId: req.user.id,
    });
  }
}
