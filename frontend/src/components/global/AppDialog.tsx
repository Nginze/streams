import React from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
};

const AppDialog = ({ children, content }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">{content}</DialogContent>
    </Dialog>
  );
};

export default AppDialog;
