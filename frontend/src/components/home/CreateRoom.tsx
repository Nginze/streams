import React, { useContext, useState } from "react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import { categories } from "./Constants";
import { useMutation } from "react-query";
import { toast } from "react-hot-toast";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { userContext } from "@/contexts/UserContext";
import { Socket } from "socket.io-client";
import { BeatLoader, ClipLoader, FadeLoader } from "react-spinners";
import { api } from "@/api";
import { ArrowRight, ArrowRightFromLine, MoveRight } from "lucide-react";
import Loader from "../global/Loader";
import { useRTCStore } from "@/engine/webrtc/store/useRTCStore";
import { useVoiceStore } from "@/engine/webrtc/store/useVoiceStore";

type Props = {
  conn: Socket;
};
const CreateRoom = ({ conn }: Props) => {
  const [roomdesc, setRoomDesc] = useState<string>("");
  const [enableAutoSpeaker, setAutoSpeaker] = useState<boolean>(false);
  const [isPrivate, setPrivate] = useState<boolean>(false);
  const [enableRoomChat, setRoomChat] = useState<boolean>(true);
  const [enableHandRaise, setHandRaise] = useState<boolean>(true);
  const [selectedToggles, setSelectedToggles] = useState<string[]>([]);

  const { user } = useContext(userContext);

  const { createRoomLoading, setCreateLoading } = useRTCStore();

  const createRoomMutation = useMutation({
    mutationFn: async (params: {
      roomDesc: string;
      creatorId: string;
      isPrivate: boolean;
      autoSpeaker: boolean;
      chatEnabled: boolean;
      handRaiseEnabled: boolean;
      categories: string[];
    }) => {
      const { data } = await api.post("/room/create", params);
      return data;
    },

    onSuccess: async (data: { roomId: string }, variables) => {
      console.log(conn, data);
      // if (data && conn) {
      console.log("sending room data to voice server", data.roomId);
      conn.emit("rtc:create_room", { roomId: data.roomId });
      // } else {
      //   alert("something went wront during creation try again");
      // }
    },

    onError: () => {
      toast("Connection Failed. Try again", {
        icon: "❌",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    },
  });

  const validate = () => {
    if (roomdesc.length > 50) {
      toast.error("Exceeded minimum room description length");
      return false;
    }

    if (roomdesc.length == 0) {
      toast.error("Please enter a room description");
      return false;
    }

    if (selectedToggles.length < 2) {
      toast("You can only select a min of 2 categories");
      return false;
    }

    if (selectedToggles.length > 3) {
      toast("You can only select a max of 3 categories");
      return false;
    }

    return true;
  };

  const { roomId: hasJoinedRoom } = useVoiceStore();

  return (
    <div className="w-full space-y-3 mt-5">
      <div>
        <span className="text-lg font-semibold">Room Details</span>
      </div>
      <div className="w-full">
        <input
          value={roomdesc}
          onChange={e => setRoomDesc(e.target.value)}
          placeholder="Describe topics shared in your room"
          className="outline-none border-none bg-app_bg_light shadow-app_shadow w-full py-3 px-3 text-sm font-semibold rounded-sm placeholder:text-sm placeholder:font-semibold"
        />
        <div
          style={{
            color: roomdesc.length > 50 ? "red" : "white",
          }}
          className="flex flex-1 justify-end text-[0.85em] py-1"
        >
          {roomdesc.length}/50
        </div>
      </div>
      <div className="flex flex-col items-start space-y-4">
        <div className="space-y-1 flex flex-col items-start">
          <span className="text-lg font-semibold">Reach a Wider Audience</span>
          <span className="text-sm opacity-70">
            Topics make it easier for people with similar interests to find your
            rooms 🤩
          </span>
          <div
            style={{
              color: selectedToggles.length > 3 ? "red" : "white",
            }}
            className="flex flex-1 justify-end text-[0.85em] py-1"
          >
            {selectedToggles.length}/3
          </div>
        </div>
        <div className="chat w-full space-y-2 max-h-[120px] overflow-y-auto">
          {categories.map(category => (
            <Toggle
              className="bg-app_bg_deep mr-2 rounded-full shadow-app_shadow"
              key={category}
              onClick={e => {
                if (selectedToggles.includes(category)) {
                  setSelectedToggles(
                    selectedToggles.filter(toggle => toggle !== category)
                  );
                } else {
                  if (selectedToggles.length <= 4) {
                    setSelectedToggles([...selectedToggles, category]);
                  } else {
                  }
                }

                console.log(selectedToggles);
              }}
              value={category}
              aria-label="Toggle italic"
            >
              <span>{category}</span>
            </Toggle>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <span className="text-lg font-semibold">Room Settings</span>
        <div className="flex flex-col items-start space-y-3">
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="isprivate">
              Private Room 🔒
            </label>
            <Switch
              checked={isPrivate}
              onCheckedChange={() => setPrivate(!isPrivate)}
              id="isprivate"
            />
          </div>
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="autospeaker">
              Enable Auto-Speaker 🗣
            </label>
            <Switch
              checked={enableAutoSpeaker}
              onCheckedChange={() => setAutoSpeaker(!enableAutoSpeaker)}
              id="autospeaker"
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="enablechat">
              Enable Chat 🤳
            </label>
            <Switch
              checked={enableRoomChat}
              onCheckedChange={() => setRoomChat(!enableRoomChat)}
              id="enablechat"
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="enablehandraise">
              Enable Hand Raising ✋
            </label>
            <Switch
              checked={enableHandRaise}
              onCheckedChange={() => setHandRaise(!enableHandRaise)}
              id="enablehandraise"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {createRoomMutation.isLoading || createRoomLoading ? (
          <div className="flex items-center justify-center space-x-2 w-full">
            <Loader width={25} height={25} bgColor="white" alt={true} />
          </div>
        ) : !hasJoinedRoom ? (
          <Button
            onClick={() => {
              if (!validate()) {
                return;
              }
              setCreateLoading(true);
              createRoomMutation.mutate({
                roomDesc: roomdesc,
                creatorId: user.userId,
                isPrivate,
                autoSpeaker: enableAutoSpeaker,
                handRaiseEnabled: enableHandRaise,
                chatEnabled: enableRoomChat,
                categories: selectedToggles,
              });
            }}
            className="w-full bg-app_cta space-x-1 p-5 h-12 font-semibold"
          >
            Start Room
          </Button>
        ) : (
          <span className="w-full flex items-center font-bold">
            Currently a participant ✨
          </span>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
