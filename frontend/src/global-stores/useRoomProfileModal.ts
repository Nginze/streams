import { create } from "zustand";
import { combine } from "zustand/middleware";

interface User {
  userid: string;
  avatarurl: string;
  bio: string;
  username: string;
  followers: number;
  following: number;
  isspeaker: boolean;
  ismod: boolean;
}
export const useRoomProfileModalStore = create(
  combine(
    {
      showOptions: false,
      modalProfile: {} as User,
    },
    set => ({
      setOptions: (val: boolean) => {
        set(s => {
          return {
            showOptions: val,
          };
        });
      },
      setModalUser: (currUser: User) => {
        set(s => {
          return {
            modalProfile: currUser,
          };
        });
      },
    })
  )
);
