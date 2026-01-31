import { useSocket } from "./SocketProvider";
import type { Socket } from "socket.io-client";

export function useSocketClient(): Socket | null {
  const { socket, ready } = useSocket();

  if (!ready || !socket) {
    return null;
  }

  return socket;
}
