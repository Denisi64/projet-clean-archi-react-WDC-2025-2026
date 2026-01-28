"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { apiGet } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getAuthMe } from "@/lib/auth";


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
  
    return () => {
      socket.off("discussion.assigned", onAssigned);
      socket.off("discussion.removed", onRemoved)
    }
  }, [ready, socket, advisorId, router])

  return (
    <div>
      <h1>Inbox conseiller</h1>

      {discussions.length === 0 && <p>Aucune discussion en attente</p>}

      <ul>
        {discussions.map((conv) => (
          <li key={conv.id}>
            <span>Client: {conv.ownerId} ; {conv.status}</span>
            <button
              onClick={() =>
                socket?.emit("discussion:assign", {
                  discussionId: conv.id,
                })
              }
            >
              Prendre en charge
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
