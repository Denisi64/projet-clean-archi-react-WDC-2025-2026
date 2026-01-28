import { useEffect } from "react";
import { useSocketClient } from "@/providers/useSocketClient";

export function useChatSocket() {
  const socket = useSocketClient();

  useEffect(() => {
    socket.on("discussion.assigned", (payload) => {
      console.log("Assigned:", payload);
    });

    socket.on("discussion.removed", (payload) => {
      console.log("Removed:", payload);
    });

    return () => {
      socket.off("discussion.assigned");
      socket.off("discussion.removed");
    };
  }, [socket]);
}
