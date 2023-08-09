import { userContext } from "@/contexts/UserContext";
import React, { useContext, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { categories } from "../home/Constants";
import { Toggle } from "../ui/toggle";
import {
  Activity,
  GitBranch,
  List,
  MoveRight,
  Pencil,
  PencilIcon,
  PuzzleIcon,
  Settings,
  Settings2Icon,
} from "lucide-react";
import { TbVersions } from "react-icons/tb";
import { Settings2 } from "lucide-react";
import {
  MdInterests,
  MdSettingsAccessibility,
  MdSettingsVoice,
  MdTopic,
} from "react-icons/md";
import { useMutation, useQuery } from "react-query";
import { api } from "@/api";
import { toast } from "react-hot-toast";
import { Separator } from "../ui/separator";
import Select from "react-select";
import { useSettingStore } from "@/store/useSettingStore";
import { useRouter } from "next/router";
import { UploadButton, Uploader } from "@/engine/fileupload/utils";
import AppDialog from "./AppDialog";
import FileUploader from "./FileUploader";

const ProfileSheet = () => {
  const { user, userLoading } = useContext(userContext);
  const [newBio, setBio] = useState(user.bio);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [microphones, setMicrophones] = useState<
    { value: string; label: string }[]
  >([]);
  const router = useRouter();

  const { data: followMetrics, isLoading: followMetricsLoading } = useQuery({
    queryKey: ["follow-count", user.userId],
    queryFn: async () => {
      const { data } = await api.get(`/profile/me/metrics/followCount`);
      return data;
    },
  });

  const {
    roomInvites,
    soundEffects,
    micAsObj,
    updateRoomInvites,
    updateSoundEffects,
    updateSelectedMic,
  } = useSettingStore();

  const profileMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/profile/update/bio", {
        bio: newBio,
      });
    },
  });

  const handleBioChange = async () => {
    if (user.bio !== newBio) {
      await toast.promise(profileMutation.mutateAsync(), {
        loading: "Syncing Bio",
        success: "Bio Updated",
        error: "Sync failed",
      });
    }
  };

  const handleBlur = async (e: any) => {
    await handleBioChange();
  };

  useEffect(() => {
    async function fetchMicrophones() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          device => device.kind === "audioinput"
        );
        const formattedMicrophones = audioInputDevices.map(device => ({
          value: device.deviceId,
          label: device.label || "Unknown microphone",
        }));
        setMicrophones(formattedMicrophones);
      } catch (error) {
        console.error("Error fetching microphones:", error);
      }
    }

    fetchMicrophones();
  }, []);

  return (
    <div className="mt-5 relative h-full px-3 ">
      <div className="chat w-full">
        <div className="space-y-3 mb-5">
          <div className="flex items-center space-x-5">
            <div className="flex relative items-center h-16 w-16 rounded-3xl cursor-pointer group">
              <img
                className="inline-block h-16 w-16 rounded-3xl cursor-pointer object-cover"
                src={user.avatarUrl}
                alt=""
              />
              <AppDialog
                open={uploaderOpen}
                setOpenChange={setUploaderOpen}
                content={<FileUploader setUploaderOpen={setUploaderOpen} />}
              >
                <div className="hidden group-hover:flex absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 justify-center items-center rounded-3xl">
                  <Pencil color="white" opacity={40} />
                </div>
              </AppDialog>
            </div>
          </div>
          <div className="flex flex-col items-start mt-4 mb-7 text-sm">
            <div className="flex flex-col items-staPt space-y-1 mb-5">
              <span className="font-semibold text-[20px]">
                {user.displayName}
              </span>
              <span className="font-normal text-[16px] opacity-40">
                @{user.userName}
              </span>
            </div>
            <div className="w-3/5 flex justify-between mb-5">
              {followMetricsLoading ? (
                <>
                  <span className="font-semibold text-[15px]"> - </span>
                  <span className="font-semibold text-[15px]"> - </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-[15px]">
                    {" "}
                    {followMetrics.followers} followers{" "}
                  </span>
                  <span className="font-semibold text-[15px]">
                    {" "}
                    {followMetrics.following} following{" "}
                  </span>
                </>
              )}
            </div>
            <Separator className="bg-app_bg_light opacity-40 w-full mx-auto" />
          </div>
        </div>
        <div className="w-full space-y-3">
          <span className="font-semibold text-[15px] flex flex-col items-start">
            <span className="flex items-center flex-col">About Me 🌟</span>
            <span className="text-[13px] opacity-30">
              Tell others more about you
            </span>
          </span>
          <div>
            <textarea
              className="chat cursor-text bg-transparent text-white outline-none  border-none w-full rounded-md hover:shadow-sm"
              value={newBio}
              onChange={e => {
                setBio(e.target.value);
              }}
              onBlur={handleBlur}
            />
          </div>
          {/* <div className="mb-6 text-[14px] opacity-70">
          Joined April 25th 2023
        </div> */}
        </div>
        <div className="mb-6 space-y-3">
          <span className="font-semibold text-[15px] flex items-start flex-col">
            <span className="flex items-center flex-col">Topics ✨</span>

            <span className="text-[13px] opacity-30">
              Topics influence what you see on your feed
            </span>
            {/* <PuzzleIcon className="ml-2" /> */}
          </span>
          <div className="chat w-full  space-y-1 max-h-[120px] overflow-y-auto">
            {categories.slice(1, 5).map(category => (
              <Toggle
                className="bg-app_bg_deep mr-1 rounded-sm shadow-app_shadow"
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
          <span className="font-semibold text-[15px] flex items-center">
            Preferences ⚙{/* <Settings2Icon className="ml-2" /> */}
          </span>
          <div className="flex flex-col items-start space-y-3">
            <div className="w-full flex flex-col items-start space-y-2">
              <Select
                options={microphones}
                isSearchable={true}
                isDisabled={router.pathname.includes("/room")}
                value={micAsObj}
                defaultValue={microphones[0]}
                onChange={newMic => {
                  console.log(newMic);
                  updateSelectedMic(newMic);
                }}
                className="text-black"
              />
              <span className="text-[13px] opacity-30">
                Audio device selection should be done before joining a room
              </span>
            </div>
            <div className="flex items-center justify-between w-full">
              <label className="cursor-pointer text-sm" htmlFor="sound-effects">
                Sound FX
              </label>
              <Switch
                checked={soundEffects}
                onCheckedChange={() => updateSoundEffects(!soundEffects)}
                id="sound-effects"
              />
            </div>
            <div className="flex items-center justify-between w-full">
              <label className="cursor-pointer text-sm" htmlFor="invites">
                Receive room invites
              </label>
              <Switch
                checked={roomInvites}
                onCheckedChange={() => updateRoomInvites(!roomInvites)}
                id="invites"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 px-2 absolute bottom-0 w-full flex items-center justify-between">
        {/* <h1 className="font-logo text-[1.5rem] leading-[2.3rem] flex items-center relative">
          <Activity size={20} className="mr-2" color="#7289da" />
          chatterbox
        </h1> */}
        <div className="flex items-center space-x-10 w-full leading=[2.3em]">
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
