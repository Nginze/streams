import UserColorProvider from "@/components/global/UserColorProvider";
import type { AppProps } from "next/app";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { ChatWsHandler } from "../src/engine/global/ChatWsHandler";
import { MainWsHandler } from "../src/engine/global/MainWsHandler";
import SoundEffectPlayer from "../src/engine/room/sound/SoundEffectPlayer";
import WebrtcApp from "../src/engine/webrtc/WebrtcApp";
import UserProvider from "../src/contexts/UserContext";
import { WebSocketProvider } from "../src/contexts/WebsocketContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WebSocketProvider>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <MainWsHandler>
            <WebrtcApp />
            <UserColorProvider>
              <Component {...pageProps} />
            </UserColorProvider>
          </MainWsHandler>
          <ChatWsHandler />
          <SoundEffectPlayer />
        </UserProvider>
        <Toaster position="bottom-center" reverseOrder={true} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WebSocketProvider>
  );
}

export default MyApp;
