import React, { useContext } from "react";
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
import { Activity, Footprints, LogOut, LogOutIcon, User } from "lucide-react";
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
import { apiClient } from "@/lib/apiclient/client";
import { useQuery, useQueryClient } from "react-query";

type Props = {};

const Navbar = ({}: Props) => {
  const { user, userLoading } = useContext(userContext);
  const queryClient = useQueryClient();
  const { data: notifications, isLoading: notificationsLoading } = useQuery(
    ["notifications", user?.userId],
    async () => {
      const { data } = await apiClient.get(
        `/profile/notification/${user.userId}`
      );
      return data;
    },
    { enabled: !!user }
  );
  const hasNewNotifications = notifications?.some(
    (notification: any) => notification.isRead === false
  );
  return (
    <div className="w-full flex items-center justify-between">
      {/* {userLoading ? (
        <Skeleton className="h-6 w-1/4 rounded-sm bg-app_bg_deep" />
      ) : ( */}
      <h1 className="font-logo text-[2rem] leading-[2.3rem] flex items-center relative">
        <Activity size={30} className="mr-2" color="#7289da" />
        chatterbox
      </h1>
      {/* )} */}
      <div className="space-x-6 flex items-center">
        <button>
          <MdLogout size={23} className="text-[#424549] hover:text-white" />
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <button
              onClick={async () => {
                await apiClient.patch(
                  `/profile/notification/markAsRead/${user.userId}`
                );
                queryClient.invalidateQueries(["notifications", user?.userId]);
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
          <SheetContent position={"right"} size={"sm"}>
            <SheetHeader>
              <SheetTitle>Notifications </SheetTitle>
            </SheetHeader>
            <NotificationsSheet />
          </SheetContent>
        </Sheet>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild> */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="hover:opacity-60">
              {userLoading ? (
                <Skeleton className="w-7 h-7 rounded-full" />
              ) : (
                <img
                  alt={`${user.userName}`}
                  src={user.avatarUrl}
                  className="rounded-full"
                  width={28}
                  height={28}
                />
              )}
            </button>
          </SheetTrigger>
          <SheetContent position={"right"} size={"sm"}>
            <SheetHeader></SheetHeader>
            <ProfileSheet />
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
  );
};

export default Navbar;
