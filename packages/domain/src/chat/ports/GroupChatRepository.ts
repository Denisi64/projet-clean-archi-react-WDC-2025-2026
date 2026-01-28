export type GroupChatMessage = {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    senderName: string;
    senderRole: "ADVISOR" | "DIRECTOR";
};

export interface GroupChatRepository {
    listMessages(input?: { limit?: number }): Promise<GroupChatMessage[]>;
    createMessage(input: { senderId: string; content: string }): Promise<GroupChatMessage>;
}
