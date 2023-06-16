import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";
import {
  BsChatLeft,
  BsGear,
  BsMic,
  BsMicMute,
  BsPersonPlus,
  BsTelephoneX,
} from "react-icons/bs";
import { MdOutlineEmojiEmotions, MdOutlineWavingHand } from "react-icons/md";
import { TbHandOff } from "react-icons/tb";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { userContext } from "../../src/contexts/UserContext";
import { WebSocketContext } from "../../src/contexts/WebsocketContext";
import { useRoomProfileModalStore } from "../../src/global-stores/useRoomProfileModal";
import { apiClient } from "../../src/lib/apiclient/client";
import { customEmojis, emoteMap } from "../../src/lib/room/chat/EmoteData";
import useSplitUsersIntoSections from "../../src/lib/room/hooks/useSplitUsersIntoSections";
import { useConsumerStore } from "../../src/lib/webrtc/store/useConsumerStore";
import { useProducerStore } from "../../src/lib/webrtc/store/useProducerStore";
import { useVoiceStore } from "../../src/lib/webrtc/store/useVoiceStore";
import useLoadRoomMeta from "../../src/lib/room/hooks/useLoadRoomMeta";
import Dialog from "../../src/components/global/Dialog";
import RoomParticipantProfile from "../../src/components/room/RoomParticipantProfile";
import RoomChatArea from "../../src/components/room/RoomChatArea";
import RoomControls from "../../src/components/room/RoomControls";
import RoomSettings from "../../src/components/room/RoomSettings";
import Navbar from "../../src/components/global/Navbar";
import PeopleList from "@/components/global/PeopleList";
import Feed from "@/components/home/Feed";
import AppLayout from "@/components/global/AppLayout";
import RoomArea from "@/components/room/RoomArea";

const room = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mic, nullify } = useVoiceStore();
  const { closeAll } = useConsumerStore();
  const { close } = useProducerStore();

  const [chatContent, setMessage] = useState<string>("");
  const [chatOpen, setChat] = useState<boolean>(true);
  const [showLeave, setLeave] = useState<boolean>(false);
  const [showPicker, setPicker] = useState<boolean>(false);
  const [showInvite, setInvite] = useState<boolean>(false);
  const [showSettings, setSettings] = useState<boolean>(false);
  const [followingLoading, setFollowingLoading] = useState<boolean>(false);

  const { id: roomId } = router.query;
  const { conn } = useContext(WebSocketContext);
  const { user, userLoading } = useContext(userContext);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { setOptions, showOptions, setModalUser, modalProfile } =
    useRoomProfileModalStore();

  const {
    chatLoading,
    roomLoading,
    roomStatusLoading,
    chatMessages,
    room,
    roomStatus,
  } = useLoadRoomMeta(roomId as string, user);

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast("Copied URL!", {
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  const { askedToSpeak, listeners, speakers } = useSplitUsersIntoSections(
    room as Room
  );

  useEffect(() => {
    const cleanup = async () => {
      await apiClient.post("/profile/ping?userId=" + user.userId);
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  // useEffect(() => {
  //   const cleanupConn = async (e: Event) => {
  //     e.preventDefault();
  //     if (!roomId) {
  //       return;
  //     }

  //     await apiClient.post(`/room/leave?roomId=${roomId}`);
  //     nullify();
  //     closeAll();
  //     close();

  //     if (room!.participants!.length <= 1) {

  //       await apiClient.post(`/room/destroy?roomId=${roomId}`);
  //     }

  //     return null;
  //   };
  //   window.addEventListener("unload", cleanupConn);
  //   window.addEventListener("beforeunload", cleanupConn);
  //   return () => {
  //     window.removeEventListener("beforeunload", cleanupConn);
  //     window.removeEventListener("unload", cleanupConn);
  //   };
  // }, [roomId]);
  // useEffect(() => {
  //   const cleanupConn = () => {
  //     if (!roomId) {
  //       return;
  //     }

  //     // Perform the first API call

  //     apiClient
  //       .post(`/room/leave?roomId=${roomId}`)
  //       .then(() => {
  //         nullify();
  //         closeAll();
  //         close();

  //         if (room!.participants!.length <= 1) {
  //           const url = `http://localhost:8000/room/destroy?roomId=${roomId}`;
  //           navigator.sendBeacon(url);
  //           // Perform the second API call using sendBeacon
  //         }
  //       })
  //       .catch(error => {
  //         console.error(error);
  //       });
  //   };

  //   window.addEventListener("beforeunload", cleanupConn);

  //   return () => {
  //     window.removeEventListener("beforeunload", cleanupConn);
  //   };
  // }, [roomId]);
  useEffect(() => {
    queryClient.invalidateQueries(["user"]);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !conn || userLoading || roomLoading) {
      return;
    }
    conn.emit("join-room", {
      roomId,
      roomMeta: {
        isAutospeaker: room!.autoSpeaker,
        isCreator: room!.creatorId === user.userId,
      },
    });

    chatInputRef.current?.focus();
  }, [roomId, userLoading, conn, roomLoading]);

  return room && roomStatus ? (
    <>
      <Head>
        <title>{room.roomDesc}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
      </Head>
      <AppLayout
        navbar={<Navbar />}
        column1={<PeopleList />}
        column2={<RoomArea />}
      />
    </>
  ) : (
    // <>
    //   <Head>
    //     <title>{room.roomDesc}</title>
    //     <meta name="description" content="Generated by create next app" />
    //     <meta name="viewport" content="width=device-width, initial-scale=1" />
    //     <link rel="icon" href="/favicon.ico" />
    //     <link rel="preconnect" href="https://fonts.googleapis.com" />
    //     <link
    //       rel="preconnect"
    //       href="https://fonts.gstatic.com"
    //       crossOrigin=""
    //     />
    //     <link
    //       href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;1,500&display=swap"
    //       rel="stylesheet"
    //     ></link>
    //     {/* <link
    //       href="https://fonts.googleapis.com/css2?family=Noto+Sans+Avestan&display=swap"
    //       rel="stylesheet"
    //     /> */}
    //   </Head>
    //   <main className="bg-zinc-800 font-display w-screen h-screen flex flex-row justify-center items-start relative">
    //     <div className="w-[600px] min-w-[600px] h-full">
    //       <div className="w-full h-16 flex flex-row font-bold text-white items-center justify-between text-lg bg-zinc-700 bg-opacity-50 p-3 border-b-[1px]">
    //         <span>🎧 Drop</span>
    //         <span>{room.roomDesc}</span>
    //         <span>
    //           <img className="w-9 h-9 rounded-full" src={user.avatarUrl} />
    //         </span>
    //       </div>
    //       <div className="text-white h-4/5 py-4 flex flex-col items-start w-full">
    //         <div className="mb-9 w-full">
    //           <p className="mb-4">Speakers ({speakers.length})</p>
    //           <div className="grid grid-cols-5 gap-2">{speakers}</div>
    //         </div>

    //         {askedToSpeak.length > 0 &&
    //           (roomStatus.isMod || room.creatorId == user.userId) && (
    //             <div className="mb-6 w-full">
    //               <p className="mb-4">Requests ({askedToSpeak.length})</p>
    //               <div className="grid grid-cols-5 gap-x-2">{askedToSpeak}</div>
    //             </div>
    //           )}

    //         <div className="mb-6 w-full">
    //           <p className="mb-4">Listeners ({listeners.length})</p>
    //           <div className="grid grid-cols-5 gap-x-2">{listeners}</div>
    //         </div>
    //       </div>
    //       <RoomControls
    //         handRaiseEnabled={room.handRaiseEnabled}
    //         chatEnabled={room.chatEnabled}
    //         chatOpen={chatOpen}
    //         conn={conn}
    //         myRoomStatus={roomStatus}
    //         roomId={roomId as string}
    //         setChat={setChat}
    //         setInvite={setInvite}
    //         setLeave={setLeave}
    //         setSettings={setSettings}
    //         user={user}
    //       />
    //     </div>
    //     <RoomChatArea
    //       chatMessages={chatMessages as ChatMessage[]}
    //       chatOpen={chatOpen}
    //       conn={conn}
    //       room={room}
    //       user={user}
    //     />
    //     {showInvite && (
    //       <>
    //         <div
    //           onClick={() => setInvite(false)}
    //           className="w-screen h-screen bg-black opacity-50 absolute z-40"
    //         ></div>
    //         <div className="w-[700px] h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
    //           <div className="flex items-center justify-center space-x-2">
    //             <div className="flex flex-col items-start">
    //               <span className="mb-2">Share room link</span>
    //               <div className="flex items-center space-x-2">
    //                 <div className="p-2 bg-zinc-600 rounded-md">
    //                   http://localhost:3000/room/{room.roomId}
    //                 </div>

    //                 <button
    //                   onClick={() =>
    //                     handleCopy(`
    //                   http://localhost:3000/room/${room.roomId}
    //                   `)
    //                   }
    //                   className="bg-sky-600 p-2 flex items-center justify-center rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
    //                 >
    //                   Copy URL
    //                 </button>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </>
    //     )}
    //     {showLeave && (
    //       <>
    //         <div
    //           onClick={() => setLeave(false)}
    //           className="w-screen h-screen bg-black opacity-50 absolute z-40"
    //         ></div>
    //         <div className="w-96 h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
    //           <div className="mb-4 text-md">
    //             <button
    //               onClick={() => setLeave(false)}
    //               className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
    //             >
    //               <AiOutlineClose fontSize={"1.2rem"} />
    //             </button>
    //             Are you sure you want to leave ?
    //           </div>
    //           <div className="flex items-center space-x-2 justify-between">
    //             <button
    //               onClick={handleLeave}
    //               className="w-1/2 rounded-md bg-sky-600 px-2 py-2 active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
    //             >
    //               Leave
    //             </button>
    //             <button
    //               onClick={() => setLeave(false)}
    //               className="w-1/2 rounded-md bg-gray-700 px-2 py-2 active:bg-gray-500 focus:outline-none focus:ring focus:ring-gray-600"
    //             >
    //               Cancel
    //             </button>
    //           </div>
    //         </div>
    //       </>
    //     )}
    //     <Dialog dialogIsOpen={showOptions} size="md" toggleDialog={setOptions}>
    //       <RoomParticipantProfile
    //         room={room}
    //         myRoomStatus={roomStatus}
    //         participantId={modalProfile.userId}
    //         toggleDialog={setOptions}
    //       />
    //     </Dialog>
    //     <Dialog
    //       dialogIsOpen={showSettings}
    //       size="md"
    //       toggleDialog={setSettings}
    //     >
    //       <RoomSettings room={room} />
    //     </Dialog>
    //   </main>
    // </>
    <>
      <Head>
        <title>{"Loading"}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
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
      </Head>
      <main className="bg-app_bg_deepest font-display w-screen h-screen flex flex-row justify-center items-center relative">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="text-white">Connecting to Room...</div>
      </main>
    </>
  );
};

export default room;
