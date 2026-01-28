'use client';

import { useState } from "react";
import { usePrivateChat } from "hooks/usePrivateChat";

export default function ChatPage() {
  const discussionId = "client-1-advisor-1";
  const authorId = "client-1";

  const { messages, sendMessage } = usePrivateChat(discussionId, authorId);
  const [input, setInput] = useState("");

  return (
    <div className="p-4">
      <div className="border h-64 overflow-auto mb-4">
        {messages.map((m: any) => (
          <div key={m.id}>
            <b>{m.authorId}</b>: {m.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
          setInput("");
        }}
      >
        <input
          className="border p-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="ml-2 border px-2 py-1">Envoyer</button>
      </form>
    </div>
  );
}
