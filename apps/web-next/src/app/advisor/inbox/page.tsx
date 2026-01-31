"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { apiGet, apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getAuthMe } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


type Discussion = {
  id: string;
  ownerId: string;
  assignedAdvisorId: string | null;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  createdAt: string;
};

export default function AdvisorInboxPage() {
  const { socket, ready } = useSocket();
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [advisorId, setAdvisorId] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    getAuthMe().then(setAdvisorId);
  }, []);
  
  useEffect(() => {
    apiGet<Discussion[]>("/chat/advisor/pending")
      .then((res) => setDiscussions(res))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!ready || !socket) return
    socket.emit("advisor.join");
    const onCreated = (payload: { discussionId: string; ownerId: string }) => {
      setDiscussions((prev) => {
        if (prev.some((conv) => conv.id === payload.discussionId)) return prev;
        return [
          {
            id: payload.discussionId,
            ownerId: payload.ownerId,
            assignedAdvisorId: null,
            status: "OPEN",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const onAssigned = (payload: {
      discussionId: string
      advisorId: string
    }) => {
      if (!advisorId) return;

      if (payload.advisorId === advisorId.id) {
        router.push(`/advisor/discussion/${payload.discussionId}`);
        return;
      }

      setDiscussions(prev =>
        prev.map(conv =>
          conv.id === payload.discussionId
            ? { ...conv, status: "ASSIGNED", assignedAdvisorId: payload.advisorId }
            : conv
        )
      )
    }
  
    const onRemoved = (payload: {
      discussionId: string
    }) => {
      setDiscussions(prev =>
        prev.filter(conv => conv.id !== payload.discussionId)
      )
    }

    socket.on("discussion.assigned", onAssigned);
    socket.on("discussion.removed", onRemoved)
    socket.on("discussion.created", onCreated);
  
    return () => {
      socket.off("discussion.assigned", onAssigned);
      socket.off("discussion.removed", onRemoved)
      socket.off("discussion.created", onCreated);
    }
  }, [ready, socket, advisorId, router])

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="w-fit px-0 text-muted-foreground hover:bg-transparent">
        <a href="/">Retour à l'accueil</a>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Inbox conseiller</CardTitle>
          <p className="text-sm text-muted-foreground">Invitations en temps réel</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {discussions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune discussion en attente</p>
          )}

          {discussions.map((conv) => (
            <div
              key={conv.id}
              className="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">Client : {conv.ownerId}</div>
                <Badge variant="outline">{conv.status}</Badge>
              </div>
              <Button
                onClick={() =>
                  apiPost(`/chat/discussion/${conv.id}/assign`).catch(console.error)
                }
              >
                Prendre en charge
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
