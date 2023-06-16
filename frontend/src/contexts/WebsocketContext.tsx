import React, { createContext, useEffect, useRef, useState } from "react";
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
    transports: ["polling"],
    reconnectionAttempts: 5,
    withCredentials: true,
  } as Partial<ManagerOptions & SocketOptions>;

  // const conn = useRef<Socket | null>(null);
  const [conn, setConn] = useState<Socket | null>(null);

  useEffect(() => {
    const ws = io("http://localhost:8000", opts);
    setConn(ws);
    // conn.current = ws;

    return () => {
      ws.disconnect();
    };
  }, []);

  console.log(conn);

  if (!conn) {
    return <div>Loading...</div>;
  }

  return (
    <WebSocketContext.Provider value={{ conn: conn }}>
      {children}
    </WebSocketContext.Provider>
  );
};
