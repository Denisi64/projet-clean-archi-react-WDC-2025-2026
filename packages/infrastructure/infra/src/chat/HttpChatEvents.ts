import { ChatEventsPort } from "@proj/domain/chat/ports/ChatEventsPort";
import { Message } from "@proj/domain/chat/Message";

type BroadcastPayload = {
    discussionId: string;
    message?: {
        id: string;
        discussionId: string;
        authorId: string;
        authorRole: string;
        content: string;
        createdAt: string;
    };
    advisorId?: string;
    fromAdvisorId?: string;
    toAdvisorId?: string;
};

export class HttpChatEvents implements ChatEventsPort {
    constructor(private readonly baseUrl: string = process.env.NOTIFICATIONS_WS_URL || "http://localhost:4001") {}

    async newMessage(payload: { discussionId: string; message: Message }): Promise<void> {
        await this.post("/broadcast-discussion-message", {
            discussionId: payload.discussionId,
            message: this.serializeMessage(payload.message),
        });
    }

    async discussionAssigned(payload: { discussionId: string; advisorId: string }): Promise<void> {
        await this.post("/broadcast-discussion-assigned", payload);
        await this.post("/broadcast-discussion-removed", { discussionId: payload.discussionId });
    }

    async discussionTransferred(payload: { discussionId: string; fromAdvisorId: string; toAdvisorId: string }): Promise<void> {
        await this.post("/broadcast-discussion-transferred", payload);
    }

    async discussionClosed(payload: { discussionId: string; advisorId: string }): Promise<void> {
        await this.post("/broadcast-discussion-closed", payload);
    }

    private serializeMessage(message: Message) {
        return {
            id: message.id,
            discussionId: message.discussionId,
            authorId: message.authorId,
            authorRole: message.authorRole,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
        };
    }

    private async post(path: string, payload: BroadcastPayload): Promise<void> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1000);
            await fetch(`${this.baseUrl}${path}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            }).catch(() => {});
            clearTimeout(timer);
        } catch {
            /* ignore */
        }
    }
}
