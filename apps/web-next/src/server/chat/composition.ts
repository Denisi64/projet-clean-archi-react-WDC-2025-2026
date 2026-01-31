import { PrismaClient } from "@prisma/client";

import { PrismaDiscussionRepository } from "@proj/infra/chat/PrismaDiscussionRepository";
import { PrismaMessageRepository } from "@proj/infra/chat/PrismaMessageRepository";

import { GetPendingDiscussionsUseCase } from "@proj/application/chat/GetPendingDiscussionsUseCase";
import { SendClientMessageUseCase } from "@proj/application/chat/SendClientMessageUseCase";

import { HttpChatEvents } from "@proj/infra/chat/HttpChatEvents";

const prisma = new PrismaClient();

const discussionRepository = new PrismaDiscussionRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);

const chatEvents = new HttpChatEvents();

export const getPendingDiscussionsUseCase = new GetPendingDiscussionsUseCase(
  discussionRepository
);

export const sendClientMessageUseCase = new SendClientMessageUseCase(
  discussionRepository,
  messageRepository,
  chatEvents
);
