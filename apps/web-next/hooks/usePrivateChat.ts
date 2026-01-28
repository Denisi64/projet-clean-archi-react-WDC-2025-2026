'use client';

import { useEffect, useState, useCallback } from "react";
import { getPrivateChatSocket } from "@/features/chat/services/chatSocket";

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
    socket.emit("join", { discussionId });

    const handler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("new-message", handler);

    return () => {
        socket.off('new-message', handler);
      };
  }, [discussionId]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getPrivateChatSocket();
      
      socket.emit("send-message", {
        discussionId,
        authorId,
        content,
      });
    },
    [discussionId, authorId],
  );

  return { messages, sendMessage };
}
