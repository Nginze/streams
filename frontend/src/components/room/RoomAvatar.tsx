import { useRouter } from "next/router";
import { useContext } from "react";
import { BsMicMute, BsShield, BsShieldFill } from "react-icons/bs";
import { useQuery, useQueryClient } from "react-query";
import { userContext } from "../../contexts/UserContext";
import { useRoomProfileModalStore } from "../../store/useRoomProfileModal";
import AppDialog from "../global/AppDialog";
import RoomParticipantProfile from "./RoomParticipantProfile";
import {
  Crown,
  Shield,
  ShieldAlert,
  ShieldIcon,
  Sword,
  SwordIcon,
} from "lucide-react";
import { SwordsIcon } from "lucide-react";
import { TbCrown, TbCrownOff } from "react-icons/tb";
import { AiFillCrown } from "react-icons/ai";
import useLoadRoomMeta from "@/hooks/useLoadRoomMeta";
import useScreenType from "@/hooks/useScreenType";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";

type Props = {
  participant: RoomParticipant;
};

const RoomAvatar = ({ participant }: Props) => {
  const queryClient = useQueryClient();

  const { setOptions, setModalUser } = useRoomProfileModalStore();
  const { user, userLoading } = useContext(userContext);

  const router = useRouter();
  const { id: roomId } = router.query;

  const { room, roomStatus: myRoomStatus } = useLoadRoomMeta(
    roomId as string,
    user
  );
  // const room = queryClient.getQueryData<Room>(["room", roomId]);

  // const myRoomStatus = queryClient.getQueryData<RoomStatus>([
  //   "room-status",
  //   roomId,
  // ]);

  const canShowIndicator = participant.indicatorOn && !participant.isMuted;

  const openParticipantProfile = () => {
    setModalUser(participant);
    setOptions(true);
  };

  const myDevice = useScreenType();
  return myDevice == "isDesktop" ? (
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
              room={room as Room}
              toggleDialog={() => {}}
            />
          }
        >
          <div
            className={`inline-block h-16 w-16 rounded-full relative cursor-pointer active:opacity-80 object-cover bg-app_bg_light`}
          >
            <img
              style={{
                border: `${canShowIndicator ? "3.3px #0084c7 solid" : ""}`,
                padding: "0.12rem",
              }}
              className={`inline-block h-16 w-16 relative rounded-full cursor-pointer active:opacity-80 object-cover`}
              src={participant.avatarUrl}
              alt=""
            />

            {participant.isMuted && participant.isSpeaker && (
              <div
                style={{
                  backgroundColor: "#0084c7",
                  borderRadius: "100%",
                  padding: "0.2rem",
                  position: "absolute",
                  right: "2%",
                  bottom: "5%",
                }}
              >
                <BsMicMute fontSize={"0.8rem"} />
              </div>
            )}
          </div>
        </AppDialog>
        {/* {participant.raisedHand && !participant.isSpeaker && (
          <div
            style={{
              position: "absolute",
              right: "1%",
              bottom: "5%",
            }}
          >
            <span>✋</span>
          </div>
        )} */}
        <span>
          <span className="text-xs font-semibold flex items-center">
            {participant.userId == (room as Room)?.creatorId && (
              <AiFillCrown
                style={{ marginRight: "1px" }}
                size={17}
                color="#ffc500"
              />
            )}
            {participant.isMod && (
              <img
                src="https://i0.wp.com/www.alphr.com/wp-content/uploads/2021/03/How-to-Make-Someone-a-Mod-in-Twitch-scaled.jpg?fit=2560%2C2560&ssl=1"
                className="w-3 h-3 object-contain mr-1"
              />
              // <div className="flex items-center justify-center mr-1 w-5 h-5 p-1 bg-blue-500 ">
              //   <Shield fontSize={29} />
              // </div>
            )}
            {/* <span className="h-10 w-10 bg-green-400"><SwordsIcon /></span> */}
            {user.userId === participant.userId ? "You" : participant.userName}
          </span>
        </span>
      </div>
    </>
  ) : (
    <>
      <div
        onClick={openParticipantProfile}
        style={{ position: "relative" }}
        className="cursor-pointer w-full h-16 flex flex-col items-center mb-6"
      >
        <Sheet>
          <SheetTrigger asChild>
            <div
              className={`inline-block h-16 w-16 rounded-full relative cursor-pointer active:opacity-80 object-cover bg-app_bg_light`}
            >
              <img
                style={{
                  border: `${canShowIndicator ? "3.3px #0084c7 solid" : ""}`,
                  padding: "0.12rem",
                }}
                className={`inline-block h-16 w-16 relative rounded-full cursor-pointer active:opacity-80 object-cover`}
                src={participant.avatarUrl}
                alt=""
              />

              {participant.isMuted && participant.isSpeaker && (
                <div
                  style={{
                    backgroundColor: "#0084c7",
                    borderRadius: "100%",
                    padding: "0.2rem",
                    position: "absolute",
                    right: "2%",
                    bottom: "5%",
                  }}
                >
                  <BsMicMute fontSize={"0.8rem"} />
                </div>
              )}
            </div>
          </SheetTrigger>
          <SheetContent position={"bottom"} size={"content"}>
            <SheetHeader></SheetHeader>
            <RoomParticipantProfile
              myRoomStatus={myRoomStatus!}
              participantId={participant.userId}
              room={room as Room}
              toggleDialog={() => {}}
            />
          </SheetContent>
        </Sheet>
        {participant.raisedHand && !participant.isSpeaker && (
          <div
            style={{
              position: "absolute",
              right: 22,
              bottom: 5,
            }}
          >
            <span>✋</span>
          </div>
        )}
        <span>
          <span className="text-xs font-semibold flex items-center">
            {participant.userId == (room as Room)?.creatorId && (
              <AiFillCrown
                style={{ marginRight: "1px" }}
                size={17}
                color="#ffc500"
              />
            )}
            {participant.isMod && (
              <img
                src="https://i0.wp.com/www.alphr.com/wp-content/uploads/2021/03/How-to-Make-Someone-a-Mod-in-Twitch-scaled.jpg?fit=2560%2C2560&ssl=1"
                className="w-3 h-3 object-contain mr-1"
              />
              // <div className="flex items-center justify-center mr-1 w-5 h-5 p-1 bg-blue-500 ">
              //   <Shield fontSize={29} />
              // </div>
            )}
            {/* <span className="h-10 w-10 bg-green-400"><SwordsIcon /></span> */}
            {user.userId === participant.userId ? "You" : participant.userName}
          </span>
        </span>
      </div>
    </>
  );
};

export default RoomAvatar;
