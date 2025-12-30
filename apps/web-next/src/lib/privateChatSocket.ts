import { io, Socket } from "socket.io-client";
console.log(">>> PRIVATE CHAT SOCKET LOADED");
let socket: Socket | null = null;

export function getPrivateChatSocket() {
  if (!socket) {
    socket = io("http://localhost:3001/private-chat", {
      transports: ["websocket"],
    });
  }
  return socket;
}
