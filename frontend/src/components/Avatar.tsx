import { useRouter } from "next/router";
import { useContext } from "react";
import { BsMicMute } from "react-icons/bs";
import { useQueryClient } from "react-query";
import { userContext } from "../contexts/UserContext";
import { useRoomProfileModalStore } from "../global-stores/useRoomProfileModal";

type Props = {
  userid: string;
  username: string;
  avatarurl: string;
  bio: string;
  active: boolean | undefined;
  isspeaker: boolean;
  askedtospeak: boolean | undefined;
  muted: boolean | undefined;
  ismod: boolean;
  followers: number;
  following: number;
};

const Avatar = ({
  userid,
  username,
  avatarurl,
  bio,
  active,
  isspeaker,
  askedtospeak,
  muted,
  ismod,
  followers,
  following,
}: Props) => {
  const { setOptions, setModalUser } = useRoomProfileModalStore();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useContext(userContext);
  const router = useRouter();
  const { id: roomId } = router.query;
  const roomPermissions: any = queryClient.getQueryData([
    "room-permissions",
    roomId,
  ]);
  const indicatorOn = active && !muted;
  const handleModalOpen = () => {
    const myProfile = {
      userid,
      username,
      avatarurl,
      bio,
      active,
      isspeaker,
      askedtospeak,
      muted,
      ismod,
      followers,
      following,
    };
    setModalUser(myProfile);

    setOptions(true);
  };
  return (
    <>
      <div
        onClick={handleModalOpen}
        style={{ position: "relative" }}
        className="cursor-pointer w-full h-16 flex flex-col items-center mb-6"
      >
        <img
          style={{
            border: `${indicatorOn ? "3.3px #0084c7 solid" : ""}`,
            padding: "0.12rem",
          }}
          className={`inline-block h-16 w-16 rounded-full cursor-pointer active:opacity-80`}
          src={avatarurl}
          alt=""
        />
        {muted && isspeaker && (
          <div
            style={{
              backgroundColor: "#0084c7",
              borderRadius: "100%",
              padding: "0.2rem",
              position: "absolute",
              right: 20,
              bottom: 6,
            }}
          >
            <BsMicMute fontSize={"0.8rem"} />
          </div>
        )}
        <span>
          <span className="text-xs font-semibold">
            {ismod && <span>👑</span>}
            {user.userid === userid ? "You" : username}
          </span>
        </span>
      </div>
    </>
  );
};

export default Avatar;
