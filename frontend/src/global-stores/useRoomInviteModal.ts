import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useRoomInviteModal = create(
  combine(
    {
      showInvite: false,
      modalUser: {} as User,
      modalRoom: {} as Room,
    },
    set => ({
      showInvite: (val: boolean) => {
        set(s => {
          return {
            showInvite: val,
          };
        });
      },
      setModalUser: (user: User) => {
        set(s => {
          return {
            modalUser: user,
          };
        });
      },
      setModalRoom: (room: Room) => {
        set(s => {
          return {
            modalRoom: room,
          };
        });
      },
    })
  )
);
