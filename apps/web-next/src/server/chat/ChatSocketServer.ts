import { Server } from "socket.io";

export const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("[WS] connected", socket.id);

  socket.on("disconnect", () => {
    console.log("[WS] disconnected", socket.id);
  });
});
