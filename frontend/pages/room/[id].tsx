import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { userContext } from "../../src/contexts/UserContext";
import { WebSocketContext } from "../../src/contexts/WebsocketContext";
import { useModalStore } from "../../src/global-stores/useModalStore";
import { apiClient } from "../../src/lib/apiclient/client";
import useSplitUsersIntoSections from "../../src/lib/room/useSplitUsersIntoSections";
import { useProducerStore } from "../../src/lib/webrtc/store/useProducerStore";
import { useConsumerStore } from "../../src/lib/webrtc/store/useConsumerStore";
import { useVoiceStore } from "../../src/lib/webrtc/store/useVoiceStore";

const room = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: roomId } = router.query;
  const { data: user, isLoading: userLoading } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);
  const { mic, nullify } = useVoiceStore();
  const { closeAll } = useConsumerStore();
  const { close } = useProducerStore();
  const [chatContent, setMessage] = useState<string>("");
  const [chatOpen, setChat] = useState<Boolean>(true);
  const [showLeave, setLeave] = useState<boolean>(false);
  const {
    setOptions,
    showOptions,
    userId: actionId,
    ismod,
    isspeaker,
  } = useModalStore();
  const { isLoading: chatLoading, data: chatMessages } = useQuery([
    "roomchat",
    roomId,
  ]);

  const { isLoading: roomLoading, data: room } = useQuery(
    ["room", roomId],
    async () => {
      const data = await apiClient.get(`/room/${roomId}?userid=${user.userid}`);
      return data.data;
    },
    { enabled: !!user && !!roomId, refetchOnWindowFocus: false }
  );

  const { isLoading: permissionsLoading, data: roomPermissions } = useQuery(
    ["room-permissions", roomId],
    async () => {
      const data = await apiClient.get(
        `/room/room-permission/${roomId}/${user.userid}`
      );
      return data.data;
    },
    { enabled: !!room }
  );

  const handleHandRaise = async () => {
    conn?.emit("user-asked-to-speak", { roomId, userId: user.userid });
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=askedtospeak&roomId=${roomId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions", roomId] });
  };

  const handleMute = async () => {
    conn?.emit("user-muted-mic", { roomId, userId: user.userid });
    if (!mic) {
      return;
    }
    mic.enabled = !mic.enabled;
    mic.enabled;
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=muted&val=${!mic.enabled}&roomId=${roomId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions"] });
  };

  const handleAddSpeaker = async () => {
    conn?.emit("add-speaker", { roomId, userId: actionId });
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=isspeaker&val=true&roomId=${roomId}&actionId=${actionId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions"] });
  };

  const handleRemoveSpeaker = async () => {
    conn?.emit("remove-speaker", { roomId, userId: actionId });
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=isspeaker&val=false&roomId=${roomId}&actionId=${actionId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions"] });
  };

  const handleMakeMod = async () => {
    conn?.emit("mod-added", { roomId, userId: actionId });
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=ismod&roomId=${roomId}&actionId=${actionId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions"] });
  };

  const handleRemoveMod = async () => {
    conn?.emit("mod-removed", { roomId, userId: actionId });
    try {
      await apiClient.put(
        `/room/room-permission/update?permission=ismod&roomId=${roomId}&actionId=${actionId}`
      );
    } catch (err) {
      console.log(err);
    }
    queryClient.invalidateQueries({ queryKey: ["room-permissions"] });
  };

  const handleChatSend = (e: any) => {
    e.preventDefault();
    console.log("chat message about to send");
    const message = {
      avatarurl: user.avatarurl,
      username: user.username,
      userid: user.userid,
      content: chatContent,
      timestamp: new Date().toDateString(),
    };
    conn?.emit("new-chat-message", { roomId, message });
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

  const { askedToSpeak, listeners, speakers } = useSplitUsersIntoSections(room);
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

    conn.emit("join-room", {
      roomId,
      roomMeta: {
        isAutospeaker: room.autospeaker,
        isCreator: room.creatorid === user.userid,
      },
    });
  }, [roomId, userLoading, conn, roomLoading]);
  return room ? (
    <>
      <Head>
        <title>{room.roomname}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-slate-900 w-screen h-screen flex flex-row justify-center items-center py-4 relative">
        <div className="w-[600px] min-w-1/3 h-full">
          <div className="w-full h-16 flex flex-row font-bold text-white items-center justify-between text-lg bg-slate-800 p-3">
            <span>Drop 🔊</span>
            <span>{room.roomname}</span>
            <span>
              <img className="w-9 h-9 rounded-full" src={user.avatarurl} />
            </span>
          </div>
          <div className="text-white h-4/5 py-4 flex flex-col items-start w-full">
            <div className="mb-9 w-full">
              <p className="mb-4">Speakers ({speakers.length})</p>
              <div className="grid grid-cols-4 gap-2">{speakers}</div>
            </div>

            {askedToSpeak.length > 0 && (
              <div className="mb-6">
                <p className="mb-4">Asked to speak ({askedToSpeak.length})</p>
                <div className="grid grid-cols-4 gap-x-2">{askedToSpeak}</div>
              </div>
            )}

            <div className="mb-6">
              <p className="mb-4">Listeners ({listeners.length})</p>
              <div className="grid grid-cols-4 gap-2">{listeners}</div>
            </div>
          </div>
          <div className="w-full h-16 flex flex-row items-center justify-between text-lg bg-slate-800 text-white font-semibold p-3">
            <span
              onClick={() => setLeave(true)}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-sm">Leave 💀</span>
            </span>

            <span
              onClick={handleMute}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-sm">Mute 🔇</span>
            </span>

            <span
              onClick={handleHandRaise}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-sm">Raise🤚</span>
            </span>

            <span
              onClick={() => setChat(!chatOpen)}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="text-sm">Chat💬</span>
            </span>
            <span className="flex flex-col items-center cursor-pointer">
              <span className="text-sm">Invite🚀</span>
            </span>
          </div>
        </div>
        {chatOpen && (
          <div className="w-96 h-full ">
            <div className="w-full h-16 font-bold text-white flex flex-row items-center justify-center text-lg bg-neutral-700 p-3">
              <span>Chat</span>
            </div>
            <div className="w-full h-4/5 px-4 py-4 bg-stone-800 overflow-y-auto overflow-x-hidden flex flex-col items-start justify-end">
              {chatMessages ? (
                (chatMessages as any).messages?.map((msg: any) => (
                  <div className="mb-4">
                    <span>
                      <img
                        className="inline rounded-full mr-2 w-6 h-6 object-cover "
                        src={msg.avatarurl}
                      />
                    </span>
                    <span
                      style={{ color: msg.color }}
                      className={`font-semibold mr-2`}
                    >
                      {msg.username}:{" "}
                    </span>
                    <span className="text-white mb-3 max-w-full break-words">
                      {msg.content}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-white">Welcome to Chat ✨</span>
              )}
            </div>
            <div className="w-full h-16 p flex flex-row items-center justify-between text-lg bg-neutral-700 p-3">
              <form className="w-full text-white" onSubmit={handleChatSend}>
                <input
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-2 text-sm bg-zinc-800"
                  placeholder="Enter a message"
                />
              </form>
            </div>
          </div>
        )}
        {showLeave && (
          <>
            <div
              onClick={() => setLeave(false)}
              className="w-screen h-screen bg-black opacity-30 absolute z-40"
            ></div>
            <div className="w-96 h-auto absolute bg-neutral-800 z-50 text-white px-5 py-4">
              <div className="mb-4 text-lg">
                Are you sure you want to leave ?
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleLeave}
                  className="w-40 bg-red-600 px-2 py-3"
                >
                  Leave
                </button>
                <button
                  onClick={() => setLeave(false)}
                  className="w-40 bg-gray-700 px-2 py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
        {showOptions && (
          <>
            <div
              onClick={() => setOptions(false)}
              className="w-screen h-screen bg-black opacity-30 absolute z-40"
            ></div>
            <div className="w-96 h-auto absolute bg-neutral-800 z-50 text-white px-5 py-4">
              <button
                onClick={isspeaker ? handleRemoveSpeaker : handleAddSpeaker}
                className="w-full mb-3 bg-blue-600 px-2 py-3"
              >
                {isspeaker ? "Remove as Speaker" : "Add as Speaker"}
              </button>
              {/* <button
                onClick={handleRemoveSpeaker}
                className="w-full mb-3 bg-blue-600 px-2 py-3"
              >
                Remove as Speaker
              </button> */}
              <button
                onClick={ismod ? handleRemoveMod : handleMakeMod}
                className="w-full mb-3 bg-blue-600 px-2 py-3"
              >
                {ismod ? "Demote Mod" : "Make Mod"}
              </button>
              <button
                onClick={() => setOptions(false)}
                className="w-full mb-3 bg-red-600 px-2 py-3"
              >
                Close
              </button>
            </div>
          </>
        )}
      </main>
    </>
  ) : null;
};

export default room;
