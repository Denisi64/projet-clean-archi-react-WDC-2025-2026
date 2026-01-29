"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  discussionId: string;
  authorId: string;
  authorRole: "CLIENT" | "ADVISOR";
  content: string;
  createdAt: string;
};

type Props = {
  discussionId: string;
  mode: "CLIENT" | "ADVISOR";
};

type Discussion = {
  id: string;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  assignedAdvisorId: string | null;
};

export function DiscussionView({ discussionId, mode }: Props) {
  const { socket, ready } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  useEffect(() => {
    if (!ready || !socket) return;

    socket.emit("discussion.join", { discussionId });

    const onMessage = (payload: { discussionId: string; message: Message }) => {
      if (payload.discussionId !== discussionId) return;
      setMessages((prev) => [...prev, payload.message]);
    };

    socket.on("discussion.newMessage", onMessage);

    return () => {
      socket.off("discussion.newMessage", onMessage);
    };
  }, [ready, socket, discussionId]);

  const closeDiscussion = () => {
    apiPost(`/chat/discussion/${discussionId}/close`).catch(console.error);
  };

  useEffect(() => {
    apiGet<Discussion>(`/chat/discussion/${discussionId}`)
      .then(setDiscussion)
      .catch(console.error);
  }, [discussionId]);

  useEffect(() => {
    if (!socket || !ready) return;

    const onClosed = (payload: { discussionId: string }) => {
      if (payload.discussionId === discussionId) {
        setDiscussion((prev) =>
          prev ? { ...prev, status: "CLOSED" } : prev
        );
      }
    };

    socket.on("discussion.closed", onClosed);

    return () => {
      socket.off("discussion.closed", onClosed);
    };
  }, [socket, ready, discussionId]);

  useEffect(() => {
    apiGet<Message[]>(`/chat/discussion/${discussionId}/messages`)
      .then(setMessages)
      .catch(console.error);
  }, [discussionId]);

  if (!discussion) {
    return <p>Chargement…</p>;
  }

  const sendMessage = () => {
    if (!socket) return;
    if (!messageInput.trim()) return;

    apiPost(`/chat/discussion/${discussionId}/message`, {
      content: messageInput,
    }).catch(console.error);

    setMessageInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {mode === "ADVISOR" ? (
          <a className="text-sm text-muted-foreground hover:underline" href="/advisor/inbox">
            Retour aux demandes
          </a>
        ) : (
          <a className="text-sm text-muted-foreground hover:underline" href="/">
            Retour à l'accueil
          </a>
        )}
        <Badge variant="outline">{discussion.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Discussion {mode === "ADVISOR" ? "conseiller" : "client"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-h-[420px] flex-col gap-3 overflow-auto rounded-md border bg-background p-4">
            {sortedMessages.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun message pour le moment.</div>
            )}
            {sortedMessages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1 rounded-md border px-3 py-2 text-sm",
                  m.authorRole === "ADVISOR" ? "bg-muted/40" : "bg-muted/10",
                )}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{m.authorRole}</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div>{m.content}</div>
              </div>
            ))}
          </div>

          {discussion.status !== "CLOSED" ? (
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message…"
              />
              <Button onClick={sendMessage} disabled={!messageInput.trim()}>
                Envoyer
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Discussion clôturée</div>
          )}
        </CardContent>
      </Card>

      {mode === "ADVISOR" && (
        <Button variant="outline" onClick={closeDiscussion}>
          Fermer la discussion
        </Button>
      )}
    </div>
  );
}
