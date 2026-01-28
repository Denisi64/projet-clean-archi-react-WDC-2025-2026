import { PrismaClient } from "@prisma/client";
import { DiscussionRepository } from "@proj/application/domain/src/chat/ports/DiscussionRepository";
import { Discussion } from "@proj/domain/chat/Discussion";
import { PrismaDiscussionMapper } from "./mappers/PrismaDiscussionMapper";

export class PrismaDiscussionRepository implements DiscussionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Discussion | null> {
    const raw = await this.prisma.discussion.findUnique({
      where: { id },
    });

    return raw ? PrismaDiscussionMapper.toDomain(raw) : null;
  }

  async findPending(): Promise<Discussion[]> {
    const raws = await this.prisma.discussion.findMany({
      where: {
        status: "OPEN",
        assignedAdvisorId: null,
      },
    });

    return raws.map(PrismaDiscussionMapper.toDomain);
  }

  async findByClient(ownerId: string): Promise<Discussion[]> {
    const raws = await this.prisma.discussion.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });

    return raws.map(PrismaDiscussionMapper.toDomain);
  }

  async findByAdvisor(advisorId: string): Promise<Discussion[]> {
    const raws = await this.prisma.discussion.findMany({
      where: { assignedAdvisorId: advisorId },
    });

    return raws.map(PrismaDiscussionMapper.toDomain);
  }

  async save(discussion: Discussion): Promise<void> {
    await this.prisma.discussion.upsert({
      where: { id: discussion.id },
      update: {
        assignedAdvisorId: discussion.assignedAdvisorId,
        status: discussion.status,
        title: discussion.title ?? null,
        updatedAt: discussion.updatedAt,
      },
      create: {
        id: discussion.id,
        ownerId: discussion.ownerId,
        assignedAdvisorId: discussion.assignedAdvisorId,
        status: discussion.status,
        title: discussion.title ?? null,
      },
    });
  }

  async assign(discussionId: string, advisorId: string): Promise<void> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      throw new Error("Discussion not found");
    }

    if (discussion.assignedAdvisorId) {
      throw new Error("Discussion already assigned");
    }

    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        assignedAdvisorId: advisorId,
        status: "ASSIGNED",
      },
    });
  }
}
