import React, { createContext, useEffect, useRef } from "react";
import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";

type Props = {
  children: React.ReactNode;
};

interface WsContext {
  conn: Socket | null;
}

export const WebSocketContext = createContext<WsContext>({} as WsContext);

export const WebSocketProvider = ({ children }: Props) => {
  const opts = {
    transports: ['polling'],
    reconnectionAttempts: 5,
    withCredentials: true,
  } as Partial<ManagerOptions & SocketOptions>;

  const conn = useRef<Socket | null>(null);

  useEffect(() => {
    const ws = io("http://localhost:8000", opts);
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
