import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useModalStore = create(
  combine(
    {
      showOptions: false,
      userId: null as string | null,
      ismod: false,
      isspeaker: false,
    },
    set => ({
      setOptions: (val: boolean) => {
        set(s => {
          return {
            showOptions: val,
          };
        });
      },
      setUserId: (userId: string) => {
        set(s => {
          return {
            userId,
          };
        });
      },
      setIsMod: (val: boolean) => {
        set(s => {
          return {
            ismod: val,
          };
        });
      },
      setIsSpeaker: (val: boolean) => {
        set(s => {
          return {
            isspeaker: val,
          };
        });
      },
    })
  )
);
