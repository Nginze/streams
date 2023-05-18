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
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { userContext } from "../../src/contexts/UserContext";
import { WebSocketContext } from "../../src/contexts/WebsocketContext";
import { useRoomProfileModalStore } from "../../src/global-stores/useRoomProfileModal";
import { apiClient } from "../../src/lib/apiclient/client";
import { customEmojis, emoteMap } from "../../src/lib/room/chat/EmoteData";
import useSplitUsersIntoSections from "../../src/lib/room/useSplitUsersIntoSections";
import { useConsumerStore } from "../../src/lib/webrtc/store/useConsumerStore";
import { useProducerStore } from "../../src/lib/webrtc/store/useProducerStore";
import { useVoiceStore } from "../../src/lib/webrtc/store/useVoiceStore";

const room = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: roomId } = router.query;
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { data: user, isLoading: userLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const { mic, nullify } = useVoiceStore();
  const { closeAll } = useConsumerStore();
  const { close } = useProducerStore();
  const [chatContent, setMessage] = useState<string>("");
  const [chatOpen, setChat] = useState<boolean>(true);
  const [showLeave, setLeave] = useState<boolean>(false);
  const [showPicker, setPicker] = useState<boolean>(false);
  const [showInvite, setInvite] = useState<boolean>(false);
  const [showSettings, setSettings] = useState<boolean>(false);

  const { setOptions, showOptions, setModalUser, modalProfile } =
    useRoomProfileModalStore();

  const { isLoading: chatLoading, data: chatMessages } = useQuery(
    ["roomchat", roomId],
    { refetchInterval: false, refetchOnWindowFocus: false }
  );

  const { isLoading: roomLoading, data: room } = useQuery(
    ["room", roomId],
    async () => {
      const data = await apiClient.get(`/room/${roomId}?userid=${user.userid}`);
      return data.data;
    },
    { enabled: !!user && !!roomId, refetchOnWindowFocus: false }
  );

  const permissionMutation = useMutation({
    mutationFn: async (params: any) => {
      params.actionId
        ? await apiClient.put(
            `/room/room-permission/update?permission=${params.permission}&val=${params.value}&roomId=${roomId}&actionId=${params.actionId}`
          )
        : await apiClient.put(
            `/room/room-permission/update?permission=${params.permission}&val=${params.value}&roomId=${roomId}`
          );
    },
    onMutate: variables => {
      queryClient.setQueryData(["room-permissions", roomId], (data: any) => ({
        ...data,
        [variables.permission]: variables.value,
      }));
    },
  });

  const handleHandRaise = async () => {
    if (conn) {
      conn.emit("user-asked-to-speak", { roomId, userId: user.userid });
      try {
      } catch (err) {
        console.log(err);
        toast("Connection Failed. Try again", {
          icon: "",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } else {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleMute = async () => {
    if (!conn || !mic) {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    const muteState = mic.enabled;
    conn.emit("user-muted-mic", { roomId, userId: user.userid });
    mic.enabled = !mic.enabled;
    console.log(muteState);

    try {
      permissionMutation.mutate({
        permission: "muted",
        value: !roomPermissions.muted,
      });
    } catch (err) {
      console.log(err);
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleAddSpeaker = async () => {
    setOptions(false);
    if (conn) {
      conn.emit("add-speaker", { roomId, userId: modalProfile.userid });
      try {
        permissionMutation.mutate({
          permission: "isspeaker",
          value: true,
          actionId: modalProfile.userid,
        });
        // await apiClient.put(
        //   `/room/room-permission/update?permission=isspeaker&val=true&roomId=${roomId}&actionId=${modalProfile.userid}`
        // );
      } catch (err) {
        console.log(err);
        toast("Connection Failed. Try again", {
          icon: "",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } else {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleRemoveSpeaker = async () => {
    setOptions(false);
    if (conn) {
      conn.emit("remove-speaker", { roomId, userId: modalProfile.userid });
      try {
        permissionMutation.mutate({
          permission: "isspeaker",
          value: false,
          actionId: modalProfile.userid,
        });
        // await apiClient.put(
        //   `/room/room-permission/update?permission=isspeaker&val=false&roomId=${roomId}&actionId=${modalProfile.userid}`
        // );
      } catch (err) {
        console.log(err);

        toast("Connection Failed. Try again", {
          icon: "",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } else {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleMakeMod = async () => {
    setOptions(false);
    if (conn) {
      conn.emit("mod-added", { roomId, userId: modalProfile.userid });
      try {
        await apiClient.put(
          `/room/room-permission/update?permission=ismod&roomId=${roomId}&actionId=${modalProfile.userid}`
        );
      } catch (err) {
        console.log(err);
        toast("Connection Failed. Try again", {
          icon: "",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } else {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleRemoveMod = async () => {
    setOptions(false);
    if (conn) {
      conn.emit("mod-removed", { roomId, userId: modalProfile.userid });
      try {
        await apiClient.put(
          `/room/room-permission/update?permission=ismod&roomId=${roomId}&actionId=${modalProfile.userid}`
        );
      } catch (err) {
        console.log(err);
        toast("Connection Failed. Try again", {
          icon: "",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    } else {
      toast("Connection Failed. Try again", {
        icon: "",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    }
  };

  const handleChatBan = (e: any) => {};

  const handleMakeRoomAdmin = (e: any) => {};

  const handleKick = (e: any) => {};

  const handleFollow = (e: any) => {};

  const handleChatSend = (e: any) => {
    e.preventDefault();
    setPicker(false);
    const message = {
      avatarurl: user.avatarurl,
      username: user.username,
      userid: user.userid,
      content: chatContent,
      timestamp: new Date().toDateString(),
    };
    conn?.emit("new-chat-message", { roomId, message });
    setMessage("")
  };

  const handleLeave = async () => {
    try {
      await apiClient.post(`/room/leave?roomId=${roomId}`).then(res => {
        conn?.emit("leave-room", { roomId });
        nullify();
        closeAll();
        close();
        router.push("/");
      });
    } catch (error) {
      console.log(error);
      router.push("/");
    }
  };

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

  const addEmoji = (e: any) => {
    const emoji = e.native ? e.native : ` ${e.shortcodes} `;
    chatInputRef.current?.focus();
    setMessage(chatContent => chatContent + emoji);
  };

  const parseMessage = (msg: string) => {
    let tokens: any = msg.split(" ");
    let parsedMessage: (React.ReactNode | string)[] = [];
    tokens = tokens.map((t: any) => {
      const parsedToken = t.replaceAll(":", "");
      if (emoteMap[parsedToken] && t.indexOf(":") > -1) {
        parsedMessage?.push(
          <img className="inline" src={emoteMap[parsedToken]} />
        );
        parsedMessage.push(" ");
      } else {
        parsedMessage?.push(t);
        parsedMessage.push(" ");
      }
    });
    return parsedMessage;
  };

  const { askedToSpeak, listeners, speakers } = useSplitUsersIntoSections(room);

  const { isLoading: permissionsLoading, data: roomPermissions } = useQuery(
    ["room-permissions", roomId],
    async () => {
      const data = await apiClient.get(
        `/room/room-permission/${roomId}/${user.userid}`
      );
      return data.data;
    },
    { enabled: !!room, refetchOnWindowFocus: false, refetchInterval: false }
  );

  useEffect(() => {
    const cleanupConn = async (e: Event) => {
      e.preventDefault();
      if (!roomId) {
        return;
      }
      await apiClient.post(`/room/leave?roomId=${roomId}`);
      nullify();
      closeAll();
      close();
      return null;
    };
    window.addEventListener("unload", cleanupConn);
    window.addEventListener("beforeunload", cleanupConn);
    return () => {
      window.removeEventListener("beforeunload", cleanupConn);
      window.removeEventListener("unload", cleanupConn);
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !conn || userLoading || roomLoading) {
      return;
    }
    console.log("about to emit");
    conn.emit("join-room", {
      roomId,
      roomMeta: {
        isAutospeaker: room.autospeaker,
        isCreator: room.creatorid === user.userid,
      },
    });

    chatInputRef.current?.focus();
  }, [roomId, userLoading, conn, roomLoading]);
  // return <>Hello</>
  return room ? (
    <>
      <Head>
        <title>{room?.roomname}</title>
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Avestan&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className="bg-zinc-800 font-display w-screen h-screen flex flex-row justify-center items-center relative">
        <div className="w-[600px] min-w-[600px] h-full">
          <div className="w-full h-16 flex flex-row font-bold text-white items-center justify-between text-lg bg-zinc-700 bg-opacity-50 p-3 border-b-[1px]">
            <span>🎧 Drop</span>
            <span>{room.roomname}</span>
            <span>
              <img className="w-9 h-9 rounded-full" src={user.avatarurl} />
            </span>
          </div>
          <div className="text-white h-4/5 py-4 flex flex-col items-start w-full">
            <div className="mb-9 w-full">
              <p className="mb-4">Speakers ({speakers.length})</p>
              <div className="grid grid-cols-5 gap-2">{speakers}</div>
            </div>

            {askedToSpeak.length > 0 && (
              <div className="mb-6 w-full">
                <p className="mb-4">Asked to speak ({askedToSpeak.length})</p>
                <div className="grid grid-cols-5 gap-x-2">{askedToSpeak}</div>
              </div>
            )}

            <div className="mb-6 w-full">
              <p className="mb-4">Listeners ({listeners.length})</p>
              <div className="grid grid-cols-5 gap-x-2">{listeners}</div>
            </div>
          </div>
          <div className="w-full h-16 flex flex-row items-center justify-center text-lg bg-zinc-700 bg-opacity-50 border-t-[1px] text-white p-3">
            <div className="flex flex-row items-center w-4/5  justify-between ">
              <button
                onClick={() => setLeave(true)}
                className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
              >
                <BsTelephoneX fontSize={"1.2rem"} />
                <span className="text-xs">Leave</span>
              </button>

              <button
                onClick={handleMute}
                className="flex flex-col space-y-1 items-center px-2 py-1 rounded-md  cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
              >
                {!roomPermissions?.muted ? (
                  <BsMic fontSize={"1.2rem"} />
                ) : (
                  <BsMicMute fontSize={"1.2rem"} />
                )}
                <span className="text-xs">
                  {!roomPermissions?.muted ? "Mute" : "Unmute"}
                </span>
              </button>

              <button
                onClick={() => setChat(!chatOpen)}
                className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
              >
                <BsChatLeft fontSize={"1.2rem"} />
                <span className="text-xs">Chat</span>
              </button>
              <button
                onClick={() => setInvite(true)}
                className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300 "
              >
                <BsPersonPlus />
                <span className="text-xs">Invite</span>
              </button>

              <button
                onClick={() => setSettings(true)}
                className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
              >
                <BsGear fontSize={"1.2rem"} />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>
        {chatOpen && (
          <div className="w-72 min-w-72 h-full relative ">
            <div className="w-full h-16 text-white flex flex-row items-center justify-center text-lg bg-zinc-700 bg-opacity-50 border-b-[0.5px] p-3">
              <span className="text-left w-full">Chat</span>
            </div>
            <div className="chat w-full h-4/5 px-4 py-4 bg-zinc-700 bg-opacity-50 overflow-y-auto overflow-x-hidden flex flex-col-reverse items-start">
              <div className="w-64 cursor-pointer max-h-24 absolute text-sm bg-zinc-700 flex flex-col items-start text-white top-20 px-3 py-2 rounded-lg">
                <span>room description</span>
                <span className="opacity-50">{room.roomdesc}</span>
              </div>
              {chatMessages ? (
                (chatMessages as any).messages?.map((msg: any) => (
                  <div className="mb-2">
                    <span>
                      <img
                        className="inline rounded-full mr-2 w-4 h-4 object-cover "
                        src={msg.avatarurl}
                      />
                    </span>
                    <span
                      style={{ color: msg.color }}
                      className={`font-semibold mr-2 text-sm`}
                    >
                      {msg.username}:{" "}
                    </span>
                    <span className="text-white mb-3 max-w-full break-words text-sm">
                      {parseMessage(msg.content)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-white text-sm">Welcome to Chat ✨</span>
              )}
            </div>
            <div className="w-full h-16 relative  flex flex-row items-center justify-between text-lg bg-zinc-700  pt-3 px-2">
              <form
                className="w-full text-white relative"
                onSubmit={handleChatSend}
              >
                <div className="absolute bottom-16 z-70 left-0">
                  {showPicker && (
                    <Picker
                      data={data}
                      custom={customEmojis}
                      onEmojiSelect={addEmoji}
                    />
                  )}
                </div>
                <span className="absolute right-2 top-2 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md ">
                  <span
                    onClick={() => {
                      chatInputRef.current?.focus();
                      setPicker(!showPicker);
                    }}
                  >
                    <MdOutlineEmojiEmotions fontSize={"1.2rem"} />
                  </span>
                </span>
                <input
                  value={chatContent}
                  ref={chatInputRef}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-2 py-3 text-sm bg-zinc-800 rounded-md"
                  placeholder="Send a message"
                />
              </form>
            </div>
          </div>
        )}
        {showInvite && (
          <>
            <div
              onClick={() => setInvite(false)}
              className="w-screen h-screen bg-black opacity-50 absolute z-40"
            ></div>
            <div className="w-[700px] h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="flex flex-col items-start">
                  <span className="mb-2">Share room link</span>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-zinc-600 rounded-md">
                      http://localhost:3000/room/{room.roomid}
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(`
                      http://localhost:3000/room/${room.roomid}
                      `)
                      }
                      className="bg-sky-600 p-2 flex items-center justify-center rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {showLeave && (
          <>
            <div
              onClick={() => setLeave(false)}
              className="w-screen h-screen bg-black opacity-50 absolute z-40"
            ></div>
            <div className="w-96 h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
              <div className="mb-4 text-md">
                <button
                  onClick={() => setLeave(false)}
                  className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
                >
                  <AiOutlineClose fontSize={"1.2rem"} />
                </button>
                Are you sure you want to leave ?
              </div>
              <div className="flex items-center space-x-2 justify-between">
                <button
                  onClick={handleLeave}
                  className="w-1/2 rounded-md bg-sky-600 px-2 py-2 active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                >
                  Leave
                </button>
                <button
                  onClick={() => setLeave(false)}
                  className="w-1/2 rounded-md bg-gray-700 px-2 py-2 active:bg-gray-500 focus:outline-none focus:ring focus:ring-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
        {showOptions && roomPermissions && (
          <>
            <div
              onClick={() => setOptions(false)}
              className="w-screen h-screen bg-black opacity-50 rounded-md absolute z-40"
            ></div>
            <div className="w-96 h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
              <button
                onClick={() => setOptions(false)}
                className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
              >
                <AiOutlineClose fontSize={"1.2rem"} />
              </button>
              <div className="mt-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <img
                      className="inline-block h-12 w-12 rounded-2xl active:opacity-80"
                      src={modalProfile.avatarurl}
                      alt=""
                    />

                    {user.userid !== modalProfile.userid && (
                      <button
                        onClick={handleFollow}
                        className="bg-gray-600 px-2 py-1 flex items-center justify-center rounded-md w-1/4 active:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-300"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-start space-y-2 mt-2 mb-4 text-sm">
                    <div className="flex flex-col items-start">
                      <span>{modalProfile.username}</span>
                      <span>@{modalProfile.username}</span>
                    </div>
                    <div>
                      <span className="mr-3">
                        {modalProfile.followers} Followers
                      </span>
                      <span>{modalProfile.following} Following</span>
                    </div>
                    <span>{modalProfile.bio}</span>
                  </div>
                </div>
              </div>
              {(roomPermissions.ismod || room.creatorid === user.userid) &&
                modalProfile.userid !== user.userid && (
                  <div className="space-y-4 font-normal">
                    <button
                      onClick={handleMakeRoomAdmin}
                      className="bg-sky-600 p-3 flex items-center justify-center rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                    >
                      Make Room Admin
                    </button>
                    <button
                      onClick={
                        modalProfile.isspeaker
                          ? handleRemoveSpeaker
                          : handleAddSpeaker
                      }
                      className="bg-sky-600 p-3 flex items-center justify-center rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                    >
                      {modalProfile.isspeaker
                        ? "Remove as Speaker"
                        : "Add as Speaker"}
                    </button>
                    <button
                      onClick={
                        modalProfile.ismod ? handleRemoveMod : handleMakeMod
                      }
                      className="bg-sky-600 p-3 flex items-center justify-center  rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                    >
                      {modalProfile.ismod ? "Demote" : "Make Mod"}
                    </button>

                    <button
                      onClick={handleChatBan}
                      className="bg-sky-600 p-3 flex items-center justify-center  rounded-md w-full active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
                    >
                      Ban from Chat
                    </button>
                    <button
                      onClick={handleKick}
                      className="bg-red-600 p-3 flex items-center justify-center  rounded-md w-full active:bg-red-800 focus:outline-none focus:ring focus:ring-red-300"
                    >
                      Kick
                    </button>
                  </div>
                )}
            </div>
          </>
        )}
      </main>
    </>
  ) : (
    <>
      <Head>
        <title>{room?.roomname}</title>
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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Avestan&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className="bg-zinc-800 font-display w-screen h-screen flex flex-row justify-center items-center relative">
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
