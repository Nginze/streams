import React, { createContext } from "react";
import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

type Props = {
  children: React.ReactNode;
};

interface Context {
  conn: Socket | undefined;
}

export const WebSocketContext = createContext<Context>({} as Context);

export const WebSocketProvider = ({ children }: Props) => {
  const opts = {
    transports: ["websockets", "polling"],
    reconnectionAttempts: 5,
    withCredentials: true,
  } as Partial<ManagerOptions & SocketOptions>;
  const conn = io("ws://192.168.7.131:8000", opts);
  return (
    <WebSocketContext.Provider value={{ conn }}>
      {children}
    </WebSocketContext.Provider>
  );
};
