import { PrismaClient } from "@prisma/client";

import { PrismaDiscussionRepository } from "@proj/infrastructure/chat/PrismaDiscussionRepository";
import { PrismaDiscussionRepository } from "@proj/domain/chat/ports/
import { PrismaMessageRepository } from "@proj/infrastructure/chat/PrismaMessageRepository";

import { GetPendingDiscussionsUseCase } from "@proj/application/chat/GetPendingDiscussionsUseCase";
import { SendClientMessageUseCase } from "@proj/application/chat/SendClientMessageUseCase";

import { WsChatEvents } from "./events/WsChatEvents";

const prisma = new PrismaClient();

const discussionRepository = new PrismaDiscussionRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);

const chatEvents = new WsChatEvents();

export const getPendingDiscussionsUseCase = new GetPendingDiscussionsUseCase(
  discussionRepository
);

export const sendClientMessageUseCase = new SendClientMessageUseCase(
  discussionRepository,
  messageRepository,
  chatEvents
);
