"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextValue = {
  socket: Socket | null;
  ready: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  ready: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const socketConnection = io("http://localhost:3001/chat", {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocketInstance(socketConnection);

    socketConnection.on("connect", () => {
      console.log("[WS FRONT] connected", socketConnection.id);
    });

    socketConnection.on("connect_error", (error) => {
      console.error("[WS FRONT] connect_error", error.message);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: socketInstance,
      ready: socketInstance !== null,
    }),
    [socketInstance]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
