import { userContext } from "@/contexts/UserContext";
import React, { useContext } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { categories } from "../home/Constants";
import { Toggle } from "../ui/toggle";
import { Activity, GitBranch, Settings, Settings2Icon } from "lucide-react";
import { TbVersions } from "react-icons/tb";
import { Settings2 } from "lucide-react";
import { MdSettingsAccessibility, MdSettingsVoice } from "react-icons/md";

const ProfileSheet = () => {
  const { user, userLoading } = useContext(userContext);
  return (
    <div className="mt-5 relative h-full">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <img
            className="inline-block h-16 w-16 rounded-3xl cursor-pointer"
            src={user.avatarUrl}
            alt=""
          />

          {/* {user.userId !== user.userId &&
          (!followMutation.isLoading ? (
            <button
              onClick={
                !user.followsMe ? handleFollow : handleUnfollow
              }
              className={`${
                !user.followsMe
                  ? "bg-gray-600"
                  : "ring ring-gray-600"
              } px-2 py-1 flex items-center justify-center rounded-md w-1/4 active:bg-gray-800 focus:outline-none focus:ring focus:ring-gray-300`}
            >
              {!user.followsMe ? "Follow" : "Unfollow"}
            </button>
          ) : (
            <span>...</span>
          ))} */}
        </div>
        <div className="flex flex-col items-start mt-4 mb-7 text-sm">
          <div className="flex flex-col items-start space-y-1 mb-5">
            <span className="font-semibold text-[20px]">
              {user.displayName}
            </span>
            <span className="font-normal text-[16px]">@{user.userName}</span>
          </div>
          <div className="w-3/4 flex justify-between mb-5">
            <span className="font-semibold text-[15px]">176 followers</span>
            <span className="font-semibold text-[15px]">40 following</span>
          </div>
          <div className="mb-6">{user.bio}</div>
          <div className="mb-6 text-[12px]">Joined Apr 25, 2023</div>
        </div>
      </div>
      <div className="mb-5">
        <div>Favourite topics</div>
        <div className="chat w-full space-x-2 space-y-2 max-h-[120px] overflow-y-auto">
          {categories.slice(1, 5).map(category => (
            <Toggle
              className="bg-app_bg_deep"
              key={category}
              value={category}
              aria-label="Toggle italic"
            >
              <span>{category}</span>
            </Toggle>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <span className="font-semibold text-[20px] flex items-center">
          Settings
          <Settings2Icon className="ml-2"/>
        </span>
        <div className="flex flex-col items-start space-y-3">
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer text-sm" htmlFor="sound-effects">
              Sound effects
            </label>
            <Switch checked={false} id="sound-effects" />
          </div>
          <div className="flex items-center justify-between w-full">
            <label className="cursor-pointer text-sm" htmlFor="invites">
              Room Invites
            </label>
            <Switch checked={false} id="invites" />
          </div>
        </div>
      </div>
      <div className="py-4 px-2 absolute bottom-0 w-full flex items-center justify-between">
        <h1 className="font-logo text-[1.5rem] leading-[2.3rem] flex items-center relative">
          <Activity size={20} className="mr-2" color="#7289da" />
          chatterbox
        </h1>
        <div className="flex items-baseline space-x-6 leading=[2.3em]">
          <a className="text-sm flex items-center text-[#424549] ">
            <GitBranch className="mr-1" color="#424549" size={17} />
            v.1.0.0
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileSheet;
