import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Router, useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { WebSocketContext } from "../src/contexts/WebsocketContext";

const BACKEND_URI = "https://drop.up.railway.app";
const width = 600;
const height = 600;

const Home: NextPage = () => {
  const left =
    typeof window !== "undefined" && window.innerWidth / 2 - width / 2;
  const top =
    typeof window !== "undefined" && window.innerHeight / 2 - height / 2;

  const googleLogin = () => {
    window.open(
      BACKEND_URI + "/auth/google",
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
  scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
  height=${height}, top=${top}, left=${left}`
    );
  };

  const discordLogin = () => {
    window.open(
      BACKEND_URI + "/auth/discord",
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
    scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
    height=${height}, top=${top}, left=${left}`
    );
  };

  const githubLogin = () => {
    window.open(
      BACKEND_URI + "/auth/github",
      "",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
    scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
    height=${height}, top=${top}, left=${left}`
    );
  };

  const { conn } = useContext(WebSocketContext);
  console.log(conn)
  return (
    <div className=" bg-gray-900 text-white flex min-h-screen flex-col items-center justify-center py-2 overflow-x-hidden">
      <Head>
        <title>Login</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <div className="mb-6 text-center">
          <h1 className="font-bold text-5xl mb-3">Welcome to Drop🔊</h1>
          <p className="font-bold text-2xl">
            Voice Converstations Scaling to the Moon 🚀
          </p>
        </div>
        <div className="flex flex-col w-1/4 mb-6 text-left text-lg">
          <span>- Voice rooms</span>
          <span>- Text Chat</span>
          <span>- Themes & Customization</span>
          <span>- Room Feed</span>
          <span>- Rooms</span>
          <span>- In call management</span>
        </div>
        <div className="w-1/4">
          <button
            onClick={() => {
              githubLogin();
            }}
            className="bg-sky-600 p-3 font-bold rounded-md w-full"
          >
            Login with Github
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
