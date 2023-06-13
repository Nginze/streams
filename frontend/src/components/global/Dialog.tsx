import React from "react";
import { AiOutlineClose } from "react-icons/ai";

type Props = {
  dialogIsOpen: boolean;
  size: string;
  children: React.ReactNode;
  toggleDialog: (value: boolean) => void;
};

const sizeMap = {
  md: 96,
};

const Dialog: React.FC<Props> = ({
  dialogIsOpen,
  size,
  children,
  toggleDialog,
}) => {
  return dialogIsOpen ? (
    <>
      <div
        onClick={() => toggleDialog(false)}
        className="w-screen h-screen bg-black opacity-50 absolute z-40"
      ></div>
      <div className="w-96 h-auto absolute bg-zinc-800 rounded-md z-50 text-white px-5 py-4">
        <div className="mb-4 text-md ">
          <button
            onClick={() => toggleDialog(false)}
            className="absolute right-5 cursor-pointer hover:bg-zinc-600 active:bg-zinc-700 p-1 rounded-md "
          >
            <AiOutlineClose fontSize={"1.2rem"} />
          </button>
        </div>
        <div className="px-2 overflow-y-auto">{children}</div>
      </div>
    </>
  ) : null;
};

export default Dialog;
