import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getPrivateChatSocket(token?: string) {
  if (!socket) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4001";
    socket = io(wsUrl, {
      transports: ["websocket"],
      auth: token ? { token } : undefined,
      timeout: 2000,
    });
  }
  return socket;
}
  
