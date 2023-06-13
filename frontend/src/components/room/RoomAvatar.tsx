import { useRouter } from "next/router";
import { useContext } from "react";
import { BsMicMute } from "react-icons/bs";
import { useQueryClient } from "react-query";
import { userContext } from "../../contexts/UserContext";
import { useRoomProfileModalStore } from "../../global-stores/useRoomProfileModal";
import AppDialog from "../global/AppDialog";
import RoomParticipantProfile from "./RoomParticipantProfile";

type Props = {
  participant: RoomParticipant;
};

const RoomAvatar = ({ participant }: Props) => {
  const queryClient = useQueryClient();

  const { setOptions, setModalUser } = useRoomProfileModalStore();
  const { user, userLoading } = useContext(userContext);

  const router = useRouter();
  const { id: roomId } = router.query;

  const myRoomStatus = queryClient.getQueryData<RoomStatus>([
    "room-status",
    roomId,
  ]);

  const canShowIndicator = participant.indicatorOn && !participant.isMuted;

  const openParticipantProfile = () => {
    setModalUser(participant);
    setOptions(true);
  };
  return (
    <>
      <div
        // onClick={handleModalOpen}
        onClick={openParticipantProfile}
        style={{ position: "relative" }}
        className="cursor-pointer w-full h-16 flex flex-col items-center mb-6"
      >
        <AppDialog
          content={
            <RoomParticipantProfile
              myRoomStatus={myRoomStatus!}
              participantId={participant.userId}
              room={{} as Room}
              toggleDialog={() => {}}
            />
          }
        >
          <img
            style={{
              border: `${canShowIndicator ? "3.3px #0084c7 solid" : ""}`,
              padding: "0.12rem",
            }}
            className={`inline-block h-16 w-16 rounded-full cursor-pointer active:opacity-80`}
            src={participant.avatarUrl}
            alt=""
          />
        </AppDialog>
        {participant.raisedHand && (
          <div
            style={{
              borderRadius: "100%",
              padding: "0.4rem",
              position: "absolute",
              width: "25px",
              height: "25px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              right: 5,
              top: 2,
            }}
          >
            <span>✋</span>
          </div>
        )}
        {participant.isMuted && participant.isSpeaker && (
          <div
            style={{
              backgroundColor: "#0084c7",
              borderRadius: "100%",
              padding: "0.2rem",
              position: "absolute",
              right: 10,
              bottom: 6,
            }}
          >
            <BsMicMute fontSize={"0.8rem"} />
          </div>
        )}
        <span>
          <span className="text-xs font-semibold">
            {participant.isMod && <span>👑</span>}
            {user.userId === participant.userId ? "You" : participant.userName}
          </span>
        </span>
      </div>
    </>
  );
};

export default RoomAvatar;
