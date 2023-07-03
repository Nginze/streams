import React from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
};

const AppDialog = ({ children, content, defaultOpen}: Props) => {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">{content}</DialogContent>
    </Dialog>
  );
};

export default AppDialog;
