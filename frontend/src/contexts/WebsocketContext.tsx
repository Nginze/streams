import Loader from "@/components/global/Loader";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { VscDebugDisconnect } from "react-icons/vsc";
import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";
import { userContext } from "./UserContext";
import { toast } from "react-hot-toast";

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
  const router = useRouter();
  const { user, userLoading } = useContext(userContext);
  const { pathname } = useRouter();
  const [conn, setConn] = useState<Socket | null>(null);
  const [isConnected, setConneted] = useState<boolean>(false);

  useEffect(() => {
    const ws = io(
      process.env.NODE_ENV == "production"
        ? (process.env.NEXT_PUBLIC_PROD_API as string)
        : (process.env.NEXT_PUBLIC_DEV_API as string),
      opts
    );
    ws.on("connect", () => {
      setConn(ws);
      setConneted(true);
    });

    return () => {
      ws.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log(user, userLoading);
    if (!userLoading && pathname !== "/login" && (!user || !user.userId)) {
      toast("login to use streams");
      router.push("/login");
    }
  }, [userLoading, pathname, user]);


  if (userLoading && pathname != "/login") {
    return (
      <>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          ></link>
          <link
            href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          ></link>
        </Head>
        <div className="bg-app_bg_deepest text-white w-screen h-screen flex items-center justify-center"></div>
      </>
    );
  }

  if (!isConnected && pathname != "/login" && user && !userLoading) {
    return (
      <div className="bg-app_bg_deepest text-white w-screen h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <VscDebugDisconnect color="white" size={50} />
          <div className="text-white">You lost connection to server</div>
          <Button className="w-full bg-app_bg_deeper p-3 h-12 font-bold">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WebSocketContext.Provider value={{ conn: conn }}>
      {children}
    </WebSocketContext.Provider>
  );
};
