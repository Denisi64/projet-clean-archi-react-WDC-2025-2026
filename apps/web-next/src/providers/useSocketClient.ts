import { useSocket } from "./SocketProvider";
import type { Socket } from "socket.io-client";

export function useSocketClient(): Socket {
  const { socket, ready } = useSocket();

  if (!ready || !socket) {
    throw new Error("Socket not ready yet");
  }

  return socket;
}