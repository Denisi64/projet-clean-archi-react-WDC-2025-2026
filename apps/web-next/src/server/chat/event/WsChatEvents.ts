import { ChatEventsPort } from "@proj/domain/chat/ports/ChatEventsPort";
import { io } from "../ChatSocketServer";
import { Message } from "@proj/domain/chat/Message";

export class WsChatEvents implements ChatEventsPort {
  async newMessage(payload: {
    discussionId: string;
    message: Message;
  }): Promise<void> {
    io.emit("discussion.newMessage", payload);
  }

  async discussionAssigned(payload: {
    discussionId: string;
    advisorId: string;
  }): Promise<void> {
    io.emit("discussion.assigned", payload);
  }

  async discussionTransferred(payload: {
    discussionId: string;
    fromAdvisorId: string;
    toAdvisorId: string;
  }): Promise<void> {
    io.emit("discussion.transferred", payload);
  }

  async discussionClosed(payload: {
    discussionId: string;
    advisorId: string;
  }): Promise<void> {
    io.emit("discussion.closed", payload);
  }
}
