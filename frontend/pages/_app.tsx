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
import { Analytics } from "@vercel/analytics/react";
import "../styles/globals.css";
import "@uploadthing/react/styles.css";
import NextNProgress from "nextjs-progressbar";

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <NextNProgress />
        <WebSocketProvider>
          <MainWsHandler>
            <WebrtcApp />
            <UserColorProvider>
              <Component {...pageProps} />
            </UserColorProvider>
          </MainWsHandler>
          <ChatWsHandler />
          <SoundEffectPlayer />
        </WebSocketProvider>
        <Toaster position="bottom-center" reverseOrder={true} />
        <ReactQueryDevtools initialIsOpen={false} />
      </UserProvider>
      <Analytics />
    </QueryClientProvider>
  );
}

export default MyApp;
