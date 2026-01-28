import { Discussion } from "../Discussion";

export interface DiscussionRepository {
    findById(id: string): Promise<Discussion | null>;
    findPending(): Promise<Discussion[]>;
    findByClient(ownerId: string): Promise<Discussion[]>;
    findByAdvisor(advisorId: string): Promise<Discussion[]>;
    save(discussion: Discussion): Promise<void>;
}
