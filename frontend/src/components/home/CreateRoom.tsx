import React, { useContext, useState } from "react";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import { categories } from "./Constants";
import { useMutation } from "react-query";
import { apiClient } from "@/lib/apiclient/client";
import { toast } from "react-hot-toast";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { userContext } from "@/contexts/UserContext";
import { Socket } from "socket.io-client";
import { BeatLoader, ClipLoader, FadeLoader } from "react-spinners";

type Props = {
  conn: Socket;
};
const CreateRoom = ({ conn }: Props) => {
  const [roomdesc, setRoomDesc] = useState<string>("");
  const [enableAutoSpeaker, setAutoSpeaker] = useState<boolean>(false);
  const [isPrivate, setPrivate] = useState<boolean>(false);
  const [enableRoomChat, setRoomChat] = useState<boolean>(false);
  const [enableHandRaise, setHandRaise] = useState<boolean>(false);
  const [selectedToggles, setSelectedToggles] = useState<string[]>([]);

  const { user } = useContext(userContext);

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
      const { data } = await apiClient.post("/room/create", params);
      return data;
    },

    onSuccess: async (data: { roomId: string }, variables) => {
      console.log(conn, data);
      // if (data && conn) {
      console.log("sending room data to voice server", data.roomId);
      conn.emit("create-room", { roomId: data.roomId });
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

  return (
    <div className="w-full space-y-4 mt-5">
      <div>
        <span className="text-lg font-bold">Room Details</span>
      </div>
      <div className="w-full">
        <input
          value={roomdesc}
          onChange={e => setRoomDesc(e.target.value)}
          placeholder="Describe topics shared in your room"
          className="outline-none border-none bg-app_bg_light w-full py-3 px-3 text-sm font-semibold rounded-sm placeholder:text-sm placeholder:font-semibold"
        />
        <div className="flex flex-1 justify-end text-[0.85em] py-1">
          {roomdesc.length}/50
        </div>
      </div>
      <div className="flex flex-col items-start space-y-4">
        <div className="space-y-1 flex flex-col items-start">
          <span className="text-lg font-bold">Reach a Wider Audience</span>
          <span className="text-sm">
            Topics make it easier for people with similar interests to find your
            rooms
          </span>
        </div>
        <div className="chat w-full space-x-2 space-y-2 max-h-[120px] overflow-y-auto">
          {categories.map(category => (
            <Toggle className="bg-app_bg_deep"
              key={category}
              onClick={e => {
                if (selectedToggles.includes(category)) {
                  setSelectedToggles(
                    selectedToggles.filter(toggle => toggle !== category)
                  );
                } else {
                  setSelectedToggles([...selectedToggles, category]);
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
        <span className="text-lg font-bold">Room Settings</span>
        <div className="flex flex-col items-start space-y-3">
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="isprivate">
              Private Room
            </label>
            <Switch
              checked={isPrivate}
              onCheckedChange={() => setPrivate(!isPrivate)}
              id="isprivate"
            />
          </div>
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="autospeaker">
              Enable Auto-Speaker
            </label>
            <Switch
              checked={enableAutoSpeaker}
              onCheckedChange={() => setAutoSpeaker(!enableAutoSpeaker)}
              id="autospeaker"
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="enablechat">
              Enable Chat
            </label>
            <Switch
              checked={enableRoomChat}
              onCheckedChange={() => setRoomChat(!enableRoomChat)}
              id="enablechat"
            />
          </div>

          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer" htmlFor="enablehandraise">
              Enable Hand Raise
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
        {createRoomMutation.isLoading ? (
          <div className="flex items-center justify-center space-x-2 w-full">
            <BeatLoader size={10} color="white" className="mr-2" />
          </div>
        ) : (
          <Button
            onClick={() => {
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
            className="w-full bg-app_cta p-5 h-12 font-bold"
          >
            Create Room
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
