import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "../../lib/apiclient/client";
import { useContext, useState } from "react";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { userContext } from "../../contexts/UserContext";

type Props = {
  room: Room;
};

const RoomSettings = ({ room }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useContext(userContext);
  const { conn } = useContext(WebSocketContext);

  const [chatEnabled, setChatEnabled] = useState<boolean>(room.chatEnabled);
  const [handRaiseEnabled, setHandRaiseEnabled] = useState<boolean>(
    room.handRaiseEnabled
  );
  const [muteAllSpeakers, setMuteAllSpeakers] = useState<boolean>(false);

  const RoomSettingMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean;
      roomId: string;
    }) => {
      await apiClient.put(
        `/room/settings/${params.roomId}?state=${params.state}&value=${params.value}`
      );
    },

    onMutate: async variables => {
      // await queryClient.cancelQueries(["room", roomId]);
      // const previousRoomStatus = queryClient.getQueryData(["room", roomId]);
      // queryClient.setQueryData(["room-status", roomId], (data: any) => ({
      //   ...data,
      //   [parseCamel(variables.state)]: variables.value,
      // }));
      // return { previousRoomStatus };
    },

    onSuccess: () => {},

    onError: (error, variables, context) => {
      // if (variables.userId === user.userId) {
      //   queryClient.setQueryData(
      //     ["room-status", roomId],
      //     context!.previousRoomStatus
      //   );
      // }
    },
  });

  const handleAllowChat = (e: any) => {
    setChatEnabled(e.target.checked);
    try {
      conn?.emit("toggle-room-chat", {
        roomId: room.roomId,
      });

      RoomSettingMutation.mutate({
        roomId: room.roomId,
        state: "chat_enabled",
        value: !room.chatEnabled,
      });
    } catch (error) {}
  };

  const handleAllowHandRaising = (e: any) => {
    setHandRaiseEnabled(e.target.checked);
    try {
      conn?.emit("toggle-hand-raise-enabled", {
        roomId: room.roomId,
      });

      RoomSettingMutation.mutate({
        roomId: room.roomId,
        state: "hand_raise_enabled",
        value: !room.handRaiseEnabled,
      });
    } catch (error) {}
  };

  const handleMuteAllSpeakers = (e: any) => {
    setMuteAllSpeakers(e.target.checked);
    try {
      conn?.emit("toggle-mute-speakers", {
        roomId: room.roomId,
      });
    } catch (error) {}
  };

  return (
    <>
      <div className="mt-4">
        <div className="space-y-4">
          <div className="flex items-center">
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
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomSettings;
