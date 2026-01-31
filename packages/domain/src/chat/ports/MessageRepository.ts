import { Message } from "../Message";

export interface MessageRepository {
    findByDiscussion(discussionId: string): Promise<Message[]>;
    save(message: Message): Promise<void>;
}
