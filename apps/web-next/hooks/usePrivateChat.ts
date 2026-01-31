'use client';

import { useEffect, useState, useCallback } from "react";
import { getPrivateChatSocket } from "@/features/chat/services/chatSocket";
import { apiPost } from "@/lib/api";

export interface Message {
    id: string;
    discussionId: string;
    authorId: string;
    content: string;
    createdAt: string;
  }

export function usePrivateChat(discussionId: string, authorId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const socket = getPrivateChatSocket();
    socket.emit("discussion.join", { discussionId });

    const handler = (payload: { discussionId: string; message: Message }) => {
      if (payload.discussionId !== discussionId) return;
      setMessages((prev) => [...prev, payload.message]);
    };

    socket.on("discussion.newMessage", handler);

    return () => {
        socket.off("discussion.newMessage", handler);
      };
  }, [discussionId]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      apiPost(`/chat/discussion/${discussionId}/message`, { content: trimmed }).catch(() => {});
    },
    [discussionId],
  );

  return { messages, sendMessage };
}
