import React, { useContext, useState } from "react";
import { BsBell, BsCaretDownFill } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Activity,
  Footprints,
  LogOut,
  LogOutIcon,
  PlusCircle,
  User,
} from "lucide-react";
import { userContext } from "@/contexts/UserContext";
import { Skeleton } from "../ui/skeleton";
import { ActivityIcon } from "lucide-react";
import { BiNotification } from "react-icons/bi";
import { MdLogout, MdNotifications, MdSettings } from "react-icons/md";
import { TbLogout, TbNotification } from "react-icons/tb";
import { HiBell } from "react-icons/hi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import SettingsSheet from "./SettingsSheet";
import AppDialog from "./AppDialog";
import ProfileSheet from "./ProfileSheet";
import NotificationsSheet from "./NotificationsSheet";
import { useQuery, useQueryClient } from "react-query";
import Search from "./Search";
import Logout from "./Logout";
import { api } from "@/api";
import { Button } from "../ui/button";
import CreateRoom from "../home/CreateRoom";
import { WebSocketContext } from "@/contexts/WebsocketContext";
import { useRouter } from "next/router";
import useScreenType from "@/hooks/useScreenType";

type Props = {};

const Navbar = ({}: Props) => {
  const { user, userLoading } = useContext(userContext);
  const queryClient = useQueryClient();

  const { conn } = useContext(WebSocketContext);
  const router = useRouter();
  const myDevice = useScreenType();

  const [profileOpen, setProfileSheetOpen] = useState(false);
  const { data: notifications, isLoading: notificationsLoading } = useQuery(
    ["notifications", user?.userId],
    async () => {
      const { data } = await api.get(`/profile/notification/${user.userId}`);
      return data;
    },
    { enabled: !!user }
  );
  const hasNewNotifications = notifications?.some(
    (notification: any) => notification.isRead === false
  );
  return (
    <div className="w-full shadow-app_shadow flex items-center py-2 bg-app_bg_nav sticky top-0 z-10 font-display">
      <div
        style={{
          width: myDevice != "isDesktop" ? "90%" : "75%",
        }}
        className=" bg-app_bg_nav flex itesm-center mx-auto justify-between "
      >
        {/* {userLoading ? (
        <Skeleton className="h-6 w-1/4 rounded-sm bg-app_bg_deep" />
      ) : ( */}
        <h1
          onClick={() => {
            router.push("/home");
          }}
          className="font-logo text-[1rem] leading-[2.3rem] flex items-center relative cursor-pointer"
        >
          <img src="/logo.svg" width={25} className="mr-2" />
          <span className="relative">
            Streams
            <span className="absolute text-[8px] px-1 text-green-400">
              Beta
            </span>
          </span>
        </h1>
        {/* )} */}
        <div className="space-x-6 flex items-center ">
          {/* <Search /> */}
          {myDevice != "isMobile" ? (
            <>
              <AppDialog content={<CreateRoom conn={conn!} />}>
                <Button
                  size={"sm"}
                  className="bg-app_bg_deep shadow-app_shadow rounded-sm"
                >
                  <PlusCircle className="mr-1 h-4 2-4" /> Start Room
                </Button>
              </AppDialog>

              <AppDialog content={<Logout />}>
                <button>
                  <MdLogout
                    size={23}
                    className="text-[#424549] hover:text-white"
                  />
                </button>
              </AppDialog>
            </>
          ) : null}
          <Sheet>
            <SheetTrigger asChild>
              <button
                onClick={async () => {
                  await api.patch(
                    `/profile/notification/markAsRead/${user.userId}`
                  );
                  queryClient.invalidateQueries([
                    "notifications",
                    user?.userId,
                  ]);
                }}
                className="relative"
              >
                {hasNewNotifications && (
                  <div className="w-2 h-2 rounded-full bg-yellow-100 absolute right-0.5 top-0"></div>
                )}
                <MdNotifications
                  size={23}
                  className="text-[#424549] hover:text-white"
                />
              </button>
            </SheetTrigger>
            <SheetContent
              position={myDevice !== "isMobile" ? "right" : "bottom"}
              size={myDevice !== "isMobile" ? "sm" : "content"}
            >
              <SheetHeader>
                <SheetTitle>Notifications ✨</SheetTitle>
              </SheetHeader>
              <NotificationsSheet />
            </SheetContent>
          </Sheet>
          {/* <DropdownMenu>
          <DropdownMenuTrigger asChild> */}
          <Sheet open={profileOpen} onOpenChange={setProfileSheetOpen}>
            <SheetTrigger asChild>
              <button disabled={!user} className="hover:opacity-60">
                {userLoading ? (
                  <Skeleton className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-6 h-6">
                    <img
                      alt={`${user.userName}`}
                      src={user.avatarUrl}
                      className="rounded-full ring-2 object-cover w-full h-full"
                    />
                  </div>
              
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              
              position={myDevice !== "isMobile" ? "right" : "bottom"}
              size={myDevice !== "isMobile" ? "sm" : "content"}
            >
              <SheetHeader></SheetHeader>
              <ProfileSheet setSheetOpen={setProfileSheetOpen}/>
            </SheetContent>
          </Sheet>
          {/* </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" color="red" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu> */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
