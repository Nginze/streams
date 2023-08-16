import React, { useState } from "react";
import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";
import { api } from "@/api";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import Loader from "./Loader";

const Logout = () => {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await api.post("/auth/logout");
      router.push("/login");
      setLogoutLoading(false);
    } catch (error) {
      toast.error("logout failed");
      setLogoutLoading(false);
    }
  };
  return (
    <div className="space-y-3">
      <div className="font-semibold text-lg">Log Out</div>
      <div>Are you sure you want to logout?</div>
      <div className="flex items-center justify-center space-x-2 w-full">
        <Button
          disabled={logoutLoading}
          className="rounded-sm flex-1 py-1 px-2 bg-app_bg_light"
        >
          Cancel
        </Button>
        <Button
          disabled={logoutLoading}
          onClick={handleLogout}
          className="rounded-sm flex-1 py-1 px-2 bg-[#FF5E5E]"
        >
          {logoutLoading ? <Loader alt={true} width={15}/> : "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default Logout;
