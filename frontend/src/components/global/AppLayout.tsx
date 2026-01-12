import Head from "next/head";
import React from "react";
import { Toaster } from "react-hot-toast";
import RoomFooter from "../room/RoomFooter";
import { useRouter } from "next/router";
import useScreenType from "@/hooks/useScreenType";

type Props = {
  navbar: React.ReactNode;
  column1: React.ReactNode;
  column2: React.ReactNode;
  footer?: React.ReactNode | undefined;
};

const AppLayout = ({ navbar, column1, column2, footer }: Props) => {
  const { pathname } = useRouter();
  const myDevice = useScreenType();
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link rel="preconnect" href="https://fonts.gstatic.com"></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      {myDevice == "isDesktop" ||
      myDevice == "isTablet" ||
      myDevice == "isBigScreen" ? (
        <main className="w-screen h-screen bg-app_bg_deepest text-white font-display overflow-auto space-y-8 chat">
          {navbar}
          <div
            style={{
              width: myDevice == "isTablet" ? "90%" : "75%",
            }}
            className="m-auto space-y-16"
          >
            {myDevice == "isDesktop" || myDevice == "isBigScreen" ? (
              <div className="grid grid-cols-4 gap-x-52 w-full max-h-96 h-96">
                <div className="col-span-1 max-h-screen ">{column1}</div>
                <div className="col-span-3">{column2}</div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-x-1 w-full max-h-96 h-96">
                <div className="col-span-1 max-h-screen ">{column1}</div>
                <div className="col-span-4">{column2}</div>
              </div>
            )}
          </div>
        </main>
      ) : (
        <>
          <main className="w-screen h-screen bg-app_bg_deepest text-white font-display overflow-auto space-y-8 chat">
            {navbar}
            <div
              style={{
                width: "90%",
              }}
              className="m-auto space-y-16"
            >
              <div className="grid grid-cols-5 gap-x-1 w-full max-h-96 h-96">
                <div className="col-span-5">{column2}</div>
              </div>
            </div>
          </main>
        </>
      )}
    </>
  );
};

export default AppLayout;
