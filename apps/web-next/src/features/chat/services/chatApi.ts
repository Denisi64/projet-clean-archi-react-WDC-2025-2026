import { apiGet } from "@/lib/api";

export interface Discussion {
  id: string;
  ownerId: string;
  assignedAdvisorId: string | null;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  title?: string | null;
  updatedAt: string;
}

export async function fetchAdvisorDiscussions(): Promise<Discussion[]> {
  return apiGet("/chat/advisor");
}
