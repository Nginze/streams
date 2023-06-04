import { toast } from "react-hot-toast";
import {
  BsChatLeft,
  BsGear,
  BsMic,
  BsMicMute,
  BsPersonPlus,
  BsTelephoneX,
} from "react-icons/bs";
import { MdOutlineWavingHand } from "react-icons/md";
import { TbHandOff } from "react-icons/tb";
import { useMutation, useQueryClient } from "react-query";
import { Socket } from "socket.io-client";
import { apiClient } from "../../lib/apiclient/client";
import { useVoiceStore } from "../../lib/webrtc/store/useVoiceStore";

type Props = {
  conn: Socket | null;
  myRoomStatus: RoomStatus;
  roomId: String;
  user: User;
  chatOpen: boolean;
  handRaiseEnabled: boolean;
  chatEnabled: boolean;
  setLeave: (value: boolean) => void;
  setSettings: (value: boolean) => void;
  setInvite: (value: boolean) => void;
  setChat: (value: boolean) => void;
};

const RoomControls = ({
  conn,
  myRoomStatus,
  roomId,
  handRaiseEnabled,
  chatEnabled,
  user,
  chatOpen,
  setLeave,
  setSettings,
  setInvite,
  setChat,
}: Props) => {
  const { mic } = useVoiceStore();
  const queryClient = useQueryClient();

  const parseCamel = (snake: string) => {
    return snake.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  };

  const statusMutation = useMutation({
    mutationFn: async (params: {
      state: string;
      value: boolean;
      userId: string;
    }) => {
      await apiClient.put(
        `/room/room-status/update/${params.userId}?state=${params.state}&value=${params.value}&roomId=${roomId}`
      );
    },

    onMutate: async variables => {
      await queryClient.cancelQueries(["room-status", roomId]);

      const previousRoomStatus = queryClient.getQueryData([
        "room-status",
        roomId,
      ]);

      if (variables.userId === user.userId) {
        queryClient.setQueryData(["room-status", roomId], (data: any) => ({
          ...data,
          [parseCamel(variables.state)]: variables.value,
        }));
      }

      return { previousRoomStatus };
    },

    onSuccess: () => {},

    onError: (error, variables, context) => {
      if (variables.userId === user.userId) {
        queryClient.setQueryData(
          ["room-status", roomId],
          context!.previousRoomStatus
        );
      }
    },
  });

  const handleMute = async () => {
    if (!conn || !mic) {
      return;
    }

    conn.emit("user-muted-mic", { roomId, userId: user.userId });
    mic.enabled = !mic.enabled;

    try {
      statusMutation.mutate({
        state: "is_muted",
        value: !myRoomStatus.isMuted,
        userId: user.userId,
      });
    } catch (err) {}
  };

  const handleHandRaise = async () => {
    if (!conn) {
      return;
    }

    conn.emit("user-asked-to-speak", { roomId, userId: user.userId });
    try {
      statusMutation.mutate({
        state: "raised_hand",
        value: !myRoomStatus.raisedHand,
        userId: user.userId,
      });
    } catch (err) {}
  };

  return (
    <div className="w-full h-16 flex flex-row items-center justify-center text-lg bg-zinc-700 bg-opacity-50 border-t-[1px] text-white p-3">
      <div className="flex flex-row items-center w-4/5  justify-around ">
        <button
          onClick={() => setLeave(true)}
          className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
        >
          <BsTelephoneX fontSize={"1.2rem"} />
          <span className="text-xs">Leave</span>
        </button>

        {myRoomStatus.isSpeaker ? (
          <button
            onClick={handleMute}
            className="flex flex-col space-y-1 items-center px-2 py-1 rounded-md  cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
          >
            {!myRoomStatus?.isMuted ? (
              <BsMic fontSize={"1.2rem"} />
            ) : (
              <BsMicMute fontSize={"1.2rem"} />
            )}
            <span className="text-xs">
              {!myRoomStatus?.isMuted ? "Mute" : "Unmute"}
            </span>
          </button>
        ) : (
          handRaiseEnabled && (
            <button
              onClick={handleHandRaise}
              className="flex flex-col space-y-1 items-center px-2 py-1 rounded-md  cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
            >
              {!myRoomStatus?.raisedHand ? (
                <MdOutlineWavingHand fontSize={"1.2rem"} />
              ) : (
                <TbHandOff fontSize={"1.2rem"} />
              )}
              <span className="text-xs">
                {!myRoomStatus?.raisedHand ? "Raise" : "Unraise"}
              </span>
            </button>
          )
        )}

        {chatEnabled && (
          <button
            onClick={() => setChat(!chatOpen)}
            className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
          >
            <BsChatLeft fontSize={"1.2rem"} />
            <span className="text-xs">Chat</span>
          </button>
        )}
        <button
          onClick={() => setInvite(true)}
          className="flex flex-col space-y-1 items-center cursor-pointer px-2 py-1 rounded-md active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300 "
        >
          <BsPersonPlus />
          <span className="text-xs">Invite</span>
        </button>

        {myRoomStatus.isMod && (
          <button
            onClick={() => setSettings(true)}
            className="flex flex-col space-y-1 px-2 py-1 rounded-md items-center cursor-pointer active:bg-sky-800 focus:outline-none focus:ring focus:ring-sky-300"
          >
            <BsGear fontSize={"1.2rem"} />
            <span className="text-xs">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomControls;
