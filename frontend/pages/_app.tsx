import "../styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { useState } from "react";
import { WebSocketProvider } from "../src/contexts/WebsocketContext";
import WebrtcApp from "../src/lib/webrtc/WebrtcApp";
import UserProvider from "../src/contexts/UserContext";
import { MainWsHandler } from "../src/modules/MainWsHandler";

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <MainWsHandler>
          <UserProvider>
            <Component {...pageProps} />
            <WebrtcApp />
          </UserProvider>
        </MainWsHandler>
      </WebSocketProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default MyApp;
