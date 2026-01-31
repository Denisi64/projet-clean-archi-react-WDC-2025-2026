import { useEffect } from "react";
import { useSocketClient } from "@/providers/useSocketClient";

export function useChatSocket() {
  const socket = useSocketClient();

  useEffect(() => {
    if (!socket) return;
    socket.on("discussion.assigned", (payload) => {
      console.log("Assigned:", payload);
    });

    socket.on("discussion.removed", (payload) => {
      console.log("Removed:", payload);
    });

    return () => {
      if (!socket) return;
      socket.off("discussion.assigned");
      socket.off("discussion.removed");
    };
  }, [socket]);
}
