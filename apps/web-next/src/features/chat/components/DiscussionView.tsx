"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { apiGet, apiPost } from "@/lib/api";
import { useRouter } from "next/navigation";

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

type Advisor = {
  id: string;
  email: string;
  role: string;
};

type Discussion = {
  id: string;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  assignedAdvisorId: string | null;
};

export function DiscussionView({ discussionId, mode }: Props) {
  const router = useRouter();
  const { socket, ready } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(
    null
  );
  const [discussion, setDiscussion] = useState<Discussion | null>(null);

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

  useEffect(() => {
    if (mode !== "ADVISOR") return;

    apiGet<Advisor[]>("/chat/advisors").then(setAdvisors);
  }, [mode]);

  const handleTransfer = async () => {
    if (!selectedAdvisorId) return;

    await apiPost(`/chat/discussion/${discussionId}/transfer`, {
      toAdvisorId: selectedAdvisorId,
    }).catch(console.error);

    setShowTransfer(false);
    setSelectedAdvisorId(null);

    router.push("/advisor/inbox");
  };

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
    <div>
      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <strong>{m.authorRole}</strong> : {m.content}
          </li>
        ))}
      </ul>

      {discussion.status !== "CLOSED" ? (
        <div>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Écrire un message…"
          />

          <button onClick={sendMessage} disabled={!messageInput.trim()}>
            Envoyer
          </button>
        </div>
      ) : (
        <div>Discussion clôturée</div>
      )}

      {mode === "ADVISOR" && (
        <>
          <button onClick={() => setShowTransfer(true)}>
            Transférer la discussion
          </button>

          {showTransfer && (
            <div>
              <select
                value={selectedAdvisorId ?? ""}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
              >
                <option value="" disabled>
                  Sélectionner un conseiller
                </option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.email}
                  </option>
                ))}
              </select>

              <button onClick={handleTransfer} disabled={!selectedAdvisorId}>
                Confirmer le transfert
              </button>

              <button onClick={() => setShowTransfer(false)}>Annuler</button>
            </div>
          )}

          <button onClick={closeDiscussion}>Fermer la discussion</button>
        </>
      )}
    </div>
  );
}
