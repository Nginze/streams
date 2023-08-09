import React from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  setOpenChange?: any;
};

const AppDialog = ({
  children,
  content,
  defaultOpen,
  open,
  setOpenChange,
}: Props) => {
  return (
    <Dialog defaultOpen={defaultOpen} open={open} onOpenChange={setOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">{content}</DialogContent>
    </Dialog>
  );
};

export default AppDialog;
