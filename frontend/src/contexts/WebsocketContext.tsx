import React, { createContext, useEffect, useRef, useState } from "react";
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
    transports: ["polling"],
    reconnectionAttempts: 5,
    withCredentials: true,
  } as Partial<ManagerOptions & SocketOptions>;
  const isTunnel = false;
  const conn = useRef<Socket | null>(null);
  // const [conn, setConn] = useState<Socket | null>(null);
  useEffect(() => {
    const ws = io(
      isTunnel
        ? "wss://drop.up.railway.app"
        : "http://localhost:8000",
      opts
    );
    // setConn(ws);
    conn.current = ws;
    return () => {
      ws.disconnect();
    };
  }, []);
  // if (conn.current == null) {
  //   return (
  //     <>
  //       <div>Not connected to socket server</div>
  //     </>
  //   );
  // }
  return (
    <WebSocketContext.Provider value={{ conn: conn.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};
