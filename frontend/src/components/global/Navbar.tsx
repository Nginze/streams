import React, { useContext } from "react";
import { BsCaretDownFill } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { userContext } from "@/contexts/UserContext";
import { Skeleton } from "../ui/skeleton";

type Props = {};

const Navbar = ({}: Props) => {
  const { user, userLoading } = useContext(userContext);
  return (
    <div className="w-full flex items-start justify-between">
      {userLoading ? (
        <Skeleton className="h-6 w-1/4 rounded-sm bg-app_bg_deep" />
      ) : (
        <span className="text-3xl font-extrabold">👋 Hey, {user.userName}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:opacity-60">
            <div className="flex items-center space-x-2">
              {userLoading ? (
                <Skeleton className="w-10 h-10 rounded-full" />
              ) : (
                <img
                  alt={`${user.userName}`}
                  src={user.avatarUrl}
                  className="rounded-full"
                  width={33}
                  height={33}
                />
              )}
              <BsCaretDownFill size={10} />
            </div>
          </button>
        </DropdownMenuTrigger>
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
      </DropdownMenu>
    </div>
  );
};

export default Navbar;
