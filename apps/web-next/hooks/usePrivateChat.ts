'use client';

import { useEffect, useState, useCallback } from "react";
import { getPrivateChatSocket } from "@/lib/privateChatSocket";

export interface Message {
    id: string;
    conversationId: string;
    authorId: string;
    content: string;
    createdAt: string;
  }

export function usePrivateChat(conversationId: string, authorId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const socket = getPrivateChatSocket();
    socket.emit("join", { conversationId });

    const handler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("new-message", handler);

    return () => {
        socket.off('new-message', handler);
      };
  }, [conversationId]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getPrivateChatSocket();
      
      socket.emit("send-message", {
        conversationId,
        authorId,
        content,
      });
    },
    [conversationId, authorId],
  );

  return { messages, sendMessage };
}
