import { useMutation, useQueryClient } from "react-query";
import { api } from "../../api";
import { useContext, useEffect, useState } from "react";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { userContext } from "../../contexts/UserContext";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import RoomBanList from "./RoomBanList";
import { toast } from "react-hot-toast";

type Props = {
  room: Room;
};

const RoomSettings = ({ room }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);

  const [updatedRoomDesc, setRoomDesc] = useState<string>(room.roomDesc);
  const [chatEnabled, setChatEnabled] = useState<boolean>(room.chatEnabled);
  const [handRaiseEnabled, setHandRaiseEnabled] = useState<boolean>(
    room.handRaiseEnabled
  );
  const [muteAllSpeakers, setMuteAllSpeakers] = useState<boolean>(false);

  const RoomSettingMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean | string;
      roomId: string;
    }) => {
      await api.put(
        `/room/settings/${params.roomId}?state=${params.state}&value=${params.value}`
      );
    },

    onMutate: async variables => {
      if (variables.state == "room_desc") {
        conn?.emit("mod:change_room_name", {
          roomId: variables.roomId,
          newRoomName: variables.value,
        });
      }
    },

  });

  const handleAllowChat = async (e: any) => {
    const event = chatEnabled ? "mod:disable_chat" : "mod:enable_chat"
    setChatEnabled(!chatEnabled);
    try {
      conn?.emit(event, {
        roomId: room.roomId,
      });

      await toast.promise(
        RoomSettingMutation.mutateAsync({
          roomId: room.roomId,
          state: "chat_enabled",
          value: !room.chatEnabled,
        }),
        {

          loading: "Syncing settings ",
          success: "Room settings updated",
          error: "Sync failed",
        }
      );
    } catch (error) {}
  };

  const handleAllowHandRaising = async (e: any) => {
    const event = handRaiseEnabled ? "mod:disable_hand" : "mod:enable_hand"
    setHandRaiseEnabled(!handRaiseEnabled);
    try {
      conn?.emit(event, {
        roomId: room.roomId,
      });

      await toast.promise(
        RoomSettingMutation.mutateAsync({
          roomId: room.roomId,
          state: "hand_raise_enabled",
          value: !room.handRaiseEnabled,
        }),
        {
          loading: "Syncing settings ",
          success: "Room settings updated",
          error: "Sync failed",
        }
      );
    } catch (error) {}
  };

  // const handleRoomDescChange = (e: any) => {
  //   setRoomDesc(e.target.checked);
  //   // try {
  //   //   RoomSettingMutation.mutate({
  //   //     roomId: room.roomId,
  //   //     state: "room_desc",
  //   //     value: updatedRoomDesc,
  //   //   });
  //   // } catch (error) {}
  // };

  const handleMuteAllSpeakers = (e: any) => {
    setMuteAllSpeakers(e.target.checked);
    try {
      conn?.emit("toggle-mute-speakers", {
        roomId: room.roomId,
      });
    } catch (error) {}
  };

  // useEffect(() => {
  //   const delayDebounceFn = setTimeout(() => {
  //     if (updatedRoomDesc) {
  //       try {
  //         RoomSettingMutation.mutate({
  //           roomId: room.roomId,
  //           state: "room_desc",
  //           value: updatedRoomDesc,
  //         });
  //       } catch (error) {}
  //     }
  //   }, 1000); // Adjust the delay time as needed (in milliseconds)

  //   return () => clearTimeout(delayDebounceFn);
  // }, [updatedRoomDesc]);

  const handleRoomNameChange = async () => {
    if (room.roomDesc !== updatedRoomDesc) {
      await toast.promise(
        RoomSettingMutation.mutateAsync({
          roomId: room.roomId,
          state: "room_desc",
          value: updatedRoomDesc,
        }),
        {
          loading: "Syncing room name ",
          success: "Room name updated",
          error: "Sync failed",
        }
      );
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <span className="font-semibold text-lg">Room Details ✨</span>
      </div>
      <div className="w-full">
        <input
          onBlur={handleRoomNameChange}
          value={updatedRoomDesc}
          onChange={e => setRoomDesc(e.target.value)}
          placeholder="Describe topics shared in your room"
          className="shadow-app_shadow outline-none border-none bg-app_bg_light w-full p-2 rounded-sm"
        />
      </div>
      <div>
        <span className="font-semibold text-lg">Room Options ⚙</span>
      </div>
      <div className="space-y-4">
        {/* <div className="flex items-center justify-between w-full">
            <label htmlFor="autospeaker">Enable Auto-Speaker</label>
            <Switch id="autospeaker" />
          </div> */}

        <div className="flex items-center justify-between w-full">
          <label htmlFor="enablechat">Enable Chat</label>
          <Switch
            checked={chatEnabled}
            onCheckedChange={handleAllowChat}
            id="enablechat"
          />
        </div>

        <div className="flex items-center justify-between w-full">
          <label htmlFor="enablehandraise">Enable Hand Raise</label>
          <Switch
            checked={handRaiseEnabled}
            onCheckedChange={handleAllowHandRaising}
            id="enablehandraise"
          />
        </div>
        {/* <div className="flex items-center">
            <input
              onChange={handleMuteAllSpeakers}
              checked={muteAllSpeakers}
              id="mute-speakers"
              type="checkbox"
              className="mr-2"
            />
            <label htmlFor="mute-speakers">Mute all speakers</label>
          </div>
          <div className="flex items-center">
            <input
              onChange={handleAllowHandRaising}
              checked={handRaiseEnabled}
              id="hand-raising"
              type="checkbox"
              className="mr-2"
            />
            <label htmlFor="hand-raising">Allow hand raising</label>
          </div>
          <div className="flex items-center">
            <input
              onChange={handleAllowChat}
              checked={chatEnabled}
              id="room-chat"
              type="checkbox"
              className="mr-2"
            />
            <label htmlFor="room-chat">Allow room chat</label>
          </div> */}
      </div>
      <RoomBanList roomId={room.roomId} />

      {/* <div className="w-full">
          <Button className="w-full bg-app_cta p-5 h-12 font-bold">Save</Button>
        </div> */}
    </div>
  );
};

export default RoomSettings;
