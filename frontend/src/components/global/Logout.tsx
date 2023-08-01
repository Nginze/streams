import React from "react";
import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";

const Logout = () => {
  return (
    <div className="space-y-3">
      <div className="font-semibold text-lg">Log Out</div>
      <div>Are you sure you want to logout?</div>
      <div className="flex items-center justify-center space-x-2 w-full">
        <Button className="rounded-sm flex-1 py-1 px-2 bg-app_bg_light">
          Cancel
        </Button>
        <Button className="rounded-sm flex-1 py-1 px-2 bg-[#FF5E5E]">
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Logout;
