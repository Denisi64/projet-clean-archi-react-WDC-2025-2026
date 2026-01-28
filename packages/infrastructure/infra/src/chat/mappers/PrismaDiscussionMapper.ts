import { Discussion } from "@proj/application/domain/src/chat/Discussion";
import { DiscussionStatus, Discussion as PrismaDiscussion } from "@prisma/client";

export class PrismaDiscussionMapper {
  static toDomain(raw: {
    id: string;
    ownerId: string;
    assignedAdvisorId: string | null;
    status: DiscussionStatus;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Discussion {
    return {
      id: raw.id,
      ownerId: raw.ownerId,
      assignedAdvisorId: raw.assignedAdvisorId,
      status: raw.status,
      title: raw.title,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
