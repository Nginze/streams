import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { userContext } from "../../src/contexts/UserContext";
import { WebSocketContext } from "../../src/contexts/WebsocketContext";
import { api } from "../../src/api";
import { AiOutlineClose } from "react-icons/ai";
import { BsPeopleFill } from "react-icons/bs";
import { VscPerson } from "react-icons/vsc";
import { toast } from "react-hot-toast";
import { useSoundEffectStore } from "../../src/store/useSoundEffectStore";
import Navbar from "../../src/components/global/Navbar";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/global/AppLayout";
import PeopleList from "@/components/global/PeopleList";
import Feed from "@/components/home/Feed";
import useScreenType from "@/hooks/useScreenType";
import { Toast } from "@/components/ui/toast";
import RoomMinimizedCard from "@/components/room/RoomMinimizedCard";
import { useVoiceStore } from "@/engine/webrtc/store/useVoiceStore";
import useLoadRoomMeta from "@/hooks/useLoadRoomMeta";

interface IProps {}

const home: React.FC<IProps> = () => {
  const { user, userLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const router = useRouter();
  const [isSaving, setSaving] = useState<boolean>(false);
  const [showFollowingOnline, setFollowingOnline] = useState<boolean>(false);
  const [showCreate, setCreate] = useState<boolean>(false);
  const [showEdit, setEdit] = useState<boolean>(false);
  const [roomname, setRoomName] = useState<string>("");
  const [roomdesc, setRoomDesc] = useState<string>("");
  const [newImgUrl, setImageUrl] = useState<string>("");
  const [newBio, setBio] = useState<string>("");
  const [autospeaker, setAutoSpeaker] = useState<boolean>(false);
  const { roomId } = useVoiceStore();

  const {
    chatLoading,
    roomLoading,
    roomStatusLoading,
    chatMessages,
    room,
    roomStatus,
  } = useLoadRoomMeta(roomId as string, user, true);

  const screenType = useScreenType();
  const { data: liveRooms, isLoading: liveRoomsLoading } = useQuery(
    ["live-rooms"],
    async () => {
      const { data } = await api.get("/room/rooms/live");
      return data;
    }
  );
  const { data: followingOnline, isLoading: onlineLoading } = useQuery(
    ["following-online"],
    async () => {
      const { data } = await api.get("/profile/following/onlineList");
      return data;
    }
  );
  const handleRoomCreate = async () => {
    try {
      const { data } = await api.post("/room/create", {
        roomname,
        roomdesc,
        autospeaker,
      });
      if (data.roomid && conn) {
        console.log("sending room data to voice server", data.roomid);
        conn.emit("create-room", { roomId: data.roomid });
      } else {
        alert("something went wront during creation try again");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditProfile = async () => {
    try {
      setSaving(true);
      const { status } = await api.patch("/profile/update", {
        bio: newBio ? newBio : user.bio,
        avatarUrl: newImgUrl ? newImgUrl : user.avatarUrl,
      });
      setSaving(false);

      if (status == 200) {
        toast("Profile Updated", {
          icon: "✔",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        toast("Something went wrong", {
          icon: "❌",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // useSoundEffectStore().playSoundEffect("mute");

  return (
    <>
      <Head>
        <title>
          Chatterbox | Engaging voice conversations scaling to the moon,
        </title>
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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        ></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        ></link>

        {/* <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Avestan&display=swap"
          rel="stylesheet"
        /> */}
      </Head>
      <AppLayout
        navbar={<Navbar />}
        column1={<PeopleList />}
        column2={<Feed conn={conn!} />}
      />
      {roomId ? (
        <RoomMinimizedCard
          conn={conn!}
          user={user}
          room={room as Room}
          myRoomStatus={roomStatus!}
        />
      ) : (
        <></>
      )}
      {/* <RoomMinimizedCard /> */}
    </>
    // <>
    //   <Head>
    //     <title>Home</title>
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
    //       href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
    //       rel="stylesheet"
    //     ></link>

    //     {/* <link
    //       href="https://fonts.googleapis.com/css2?family=Noto+Sans+Avestan&display=swap"
    //       rel="stylesheet"
    //     /> */}
    //   </Head>
    //   {showFollowingOnline && (
    //     <div className="fixed inset-0 flex items-center justify-center z-50">
    //       <div
    //         onClick={() => setFollowingOnline(false)}
    //         className="w-screen h-screen bg-black opacity-50 rounded-md absolute z-40"
    //       ></div>

    //       <div className="w-[500px] h-auto absolute bg-zinc-800 z-50 text-white px-5 py-4 rounded-md">
    //         <button
    //           onClick={() => setFollowingOnline(false)}
    //           className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
    //         >
    //           <AiOutlineClose fontSize={"1.2rem"} />
    //         </button>
    //         <span className="font-semibold text-lg">Online List</span>
    //         {followingOnline && (
    //           <div className="mt-4 h-[200px]">
    //             {followingOnline.length > 0 ? (
    //               followingOnline.map((u: any) => (
    //                 <div className="flex items-center justify-between flex-row cursor-pointer">
    //                   <div className="flex flex-row items-start">
    //                     <img
    //                       className="inline-block h-12 mr-6 w-12 rounded-2xl active:opacity-80"
    //                       src={u.avatarurl}
    //                       alt=""
    //                     />
    //                     <div className="flex flex-col items-start space-y-2 mt-2 mb-4 text-sm">
    //                       <div className="flex flex-col items-start">
    //                         <span>{u.username}</span>
    //                         <span>{u.bio}</span>
    //                       </div>
    //                     </div>
    //                   </div>
    //                   <div>
    //                     <button
    //                       onClick={() => {
    //                         router.push(`/room/${u.currentroomid}`);
    //                       }}
    //                       className={`
    //                         ring ring-gray-600 px-2 py-1 align-center flex items-center justify-center rounded-md w-[70px] active:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-300`}
    //                     >
    //                       join
    //                     </button>
    //                   </div>
    //                 </div>
    //               ))
    //             ) : (
    //               <span className="w-full h-full flex items-center justify-center">
    //                 😥 No one is Online
    //               </span>
    //             )}
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   )}
    //   {showEdit && user && (
    //     <div className="fixed inset-0 flex items-center justify-center z-50">
    //       <div
    //         onClick={() => setEdit(false)}
    //         className="w-screen h-screen bg-black opacity-50 rounded-md absolute z-40"
    //       ></div>

    //       <div className="w-[500px] h-auto  absolute bg-zinc-800 z-50 text-white px-5 py-4 rounded-md">
    //         <button
    //           onClick={() => setEdit(false)}
    //           className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
    //         >
    //           <AiOutlineClose fontSize={"1.2rem"} />
    //         </button>
    //         <div className="mt-4">
    //           <div>
    //             <div className="flex items-center space-x-3">
    //               <img
    //                 className="inline-block h-12 w-12 rounded-2xl active:opacity-80"
    //                 src={user.avatarUrl}
    //                 alt=""
    //               />

    //               {/* {user.userid !== user.userid && (
    //                 <button
    //                   onClick={handleFollow}
    //                   className="bg-gray-600 px-2 py-1 flex items-center justify-center rounded-md w-1/4 active:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-300"
    //                 >
    //                   Follow
    //                 </button>
    //               )} */}
    //             </div>
    //             <div className="flex flex-col items-start space-y-2 mt-2 mb-4 text-sm">
    //               <div className="flex flex-col items-start">
    //                 <span>{user.userName}</span>
    //                 <span>@{user.userName}</span>
    //               </div>
    //               <div>
    //                 <span className="mr-3">0 Followers</span>
    //                 <span>0 Following</span>
    //               </div>
    //               <span>{user.bio}</span>
    //             </div>
    //           </div>
    //         </div>
    //         <div className="font-normal">
    //           <input
    //             className="w-full p-3 mt-4 text-white bg-zinc-700 rounded-md cursor-not-allowed"
    //             placeholder={user.userName}
    //             disabled
    //           />
    //           <input
    //             value={newBio}
    //             onChange={e => setBio(e.target.value)}
    //             className="w-full p-3 mt-4 text-white bg-zinc-700 rounded-md"
    //             placeholder={user.bio}
    //           />
    //           <input
    //             value={newImgUrl}
    //             onChange={e => setImageUrl(e.target.value)}
    //             className="w-full mb-4 p-3 mt-4 text-white bg-zinc-700 rounded-md"
    //             placeholder={user.avatarUrl}
    //           />

    //           {!isSaving ? (
    //             <button
    //               onClick={handleEditProfile}
    //               className="bg-sky-600 p-3 mb-4 flex items-center justify-center font-bold rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
    //             >
    //               Save
    //             </button>
    //           ) : (
    //             <span className="w-full justify-center font-bold">
    //               Updating...
    //             </span>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   )}
    //   {showCreate && (
    //     <div className="fixed inset-0 flex items-center justify-center z-50">
    //       <div
    //         onClick={() => setCreate(false)}
    //         className="w-screen h-screen bg-black opacity-50 absolute z-40"
    //       ></div>

    //       <div className="w-[500px] h-auto bg-zinc-800 z-50 text-white px-5 py-4 rounded-md absolute">
    //         <button
    //           onClick={() => setCreate(false)}
    //           className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
    //         >
    //           <AiOutlineClose fontSize={"1.2rem"} />
    //         </button>
    //         <span className="font-semibold text-lg">Room Details</span>
    //         <input
    //           value={roomname}
    //           onChange={e => setRoomName(e.target.value)}
    //           className="w-full mb-4 p-3 mt-4 text-white bg-zinc-700 rounded-md"
    //           placeholder="Enter room name"
    //         />
    //         <input
    //           value={roomdesc}
    //           onChange={e => setRoomDesc(e.target.value)}
    //           className="w-full mb-4 p-3 text-white bg-zinc-700 rounded-md"
    //           placeholder="Enter room description"
    //         />

    //         <div className="flex items-center mb-4">
    //           <input
    //             checked={autospeaker}
    //             type={"checkbox"}
    //             id="checkbox"
    //             className="w-4 h-4 cursor-pointer text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
    //             onChange={e => setAutoSpeaker(e.target.checked)}
    //           />

    //           <label
    //             htmlFor="checkbox"
    //             className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
    //           >
    //             Auto Join as Speaker
    //           </label>
    //         </div>

    //         <div className="flex items-center mb-4">
    //           <input
    //             checked={autospeaker}
    //             type={"checkbox"}
    //             id="checkbox"
    //             className="w-4 h-4 cursor-pointer text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
    //             onChange={e => setAutoSpeaker(e.target.checked)}
    //           />

    //           <label
    //             htmlFor="checkbox"
    //             className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
    //           >
    //             Enable Room Chat Feature
    //           </label>
    //         </div>
    //         <button
    //           onClick={handleRoomCreate}
    //           className="bg-sky-600 p-3 flex items-center justify-center font-bold rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
    //         >
    //           Create
    //         </button>
    //       </div>
    //     </div>
    //   )}
    //   <div
    //     className={`w-screen h-screen relative bg-zinc-800 text-white font-display flex min-h-screen ${
    //       screenType == "fullscreen" ? "px-10" : ""
    //     } py-2 overflow-x-hidden  flex-col justify-center items-center`}
    //   >
    //     <Navbar />
    //     <div
    //       className={`mb-6 ${
    //         screenType == "fullscreen"
    //           ? "w-full text-center"
    //           : "w-[530px] text-left"
    //       }`}
    //     >
    //       <h1 className="font-bold text-5xl mb-3">Drop 🎧</h1>
    //       <p className="font-bold text-2xl">
    //         Voice Converstations Scaling to the Moon 🚀
    //       </p>
    //       <div className="w-full flex items-center justify-center my-6">
    //         <button
    //           onClick={() => setFollowingOnline(true)}
    //           className="flex items-center bg-zinc-700 justify-center mr-6 h-12 w-12 rounded-full ring-2 ring-white active:bg-zinc-500 focus:outline-none focus:ring focus:ring-sky-300"
    //         >
    //           <BsPeopleFill fontSize={"1.5rem"} />
    //         </button>
    //         <button
    //           onClick={() => setEdit(true)}
    //           className="focus:outline-none focus:ring focus:ring-sky-300 rounded-full"
    //         >
    //           {user ? (
    //             <img
    //               className="inline-block h-12 w-12 rounded-full ring-2 active:opacity-80"
    //               src={user.avatarUrl}
    //               alt=""
    //             />
    //           ) : (
    //             <img
    //               className="inline-block h-12 w-12 rounded-full ring-2 active:opacity-80"
    //               src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmedia.istockphoto.com%2Fvectors%2Fdefault-profile-picture-avatar-photo-placeholder-vector-illustration-vector-id1223671392%3Fk%3D20%26m%3D1223671392%26s%3D612x612%26w%3D0%26h%3DlGpj2vWAI3WUT1JeJWm1PRoHT3V15_1pdcTn2szdwQ0%3D&f=1&nofb=1&ipt=a58220dabdf73b381d952502feb7f43c00df4afde7ba6b6f0de14311d7cf7797&ipo=images"
    //               alt=""
    //             />
    //           )}
    //         </button>
    //       </div>
    //     </div>
    //     <div
    //       className={`scrollbar-hide relative flex flex-col ${
    //         screenType == "fullscreen" ? "w-full" : "w-[530px]"
    //       } h-auto max-h-[200px] overflow-y-auto  mb-6 text-left text-lg`}
    //     >
    //       {!liveRooms ||
    //         (liveRooms.length == 0 && (
    //           <span className="text-center">😵 No live rooms available</span>
    //         ))}
    //       {!userLoading && liveRooms ? (
    //         liveRooms.map((lr: any) => {
    //           return (
    //             <button
    //               key={lr.roomid}
    //               onClick={() => router.push(`/room/${lr.roomId}`)}
    //               className="mb-4 w-full cursor-pointer h-auto bg-gray-700 px-4 py-3 rounded-md active:bg-gray-600 focus:outline-none focus:ring focus:ring-zinc-300"
    //             >
    //               <div className="w-full flex justify-between ">
    //                 <span className="font-semibold">{lr.roomDesc}</span>
    //                 <div>
    //                   <span className="flex items-center ">
    //                     <VscPerson />
    //                     <span className="text-sm">
    //                       {lr.participants.length}
    //                     </span>
    //                   </span { BiExit } from "react-icons/bi";>
    //                 </div>
    //               </div>
    //               <div className="flex flex-col items-start">
    //                 {lr.participants.map((u: any) => (
    //                   <span key={u} className="text-xs">
    //                     {u}
    //                   </span>
    //                 ))}
    //               </div>
    //             </button>
    //           );
    //         })
    //       ) : (
    //         <span className="w-full flex justify-center">Loading Rooms...</span>
    //       )}
    //     </div>

    //     <div
    //       className={` ${
    //         screenType == "fullscreen" ? "w-full" : "w-[530px]"
    //       } bg-transparent`}
    //     >
    //       <button
    //         onClick={() => setCreate(true)}
    //         className="bg-sky-600 w-full p-3 flex items-center justify-center font-bold rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
    //       >
    //         Create Room
    //       </button>
    //       {/* <button onClick={() => playSoundEffect("roomChatMention")}>play sound</button> */}
    //     </div>
    //     <div></div>
    //   </div>
    // </>
  );
};

export default home;
