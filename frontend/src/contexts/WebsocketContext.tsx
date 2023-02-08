import { useRouter } from "next/router";
import React, { createContext, useEffect, useRef } from "react";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";
type Props = {
  children: React.ReactNode;
};

interface Context {
  conn: Socket | null;
}

export const WebSocketContext = createContext<Context>({} as Context);

export const WebSocketProvider = ({ children }: Props) => {
  const opts = {
    transports: ["websockets", "polling"],
    reconnectionAttempts: 5,
    withCredentials: true,
  } as Partial<ManagerOptions & SocketOptions>;

  const conn = useRef<Socket | null>(null);
  useEffect(() => {
    const ws = io("ws://localhost:8000", opts);
    conn.current = ws;
    return () => {
      ws.disconnect();
    };
  }, []);
  return (
    <WebSocketContext.Provider value={{ conn: conn.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};
