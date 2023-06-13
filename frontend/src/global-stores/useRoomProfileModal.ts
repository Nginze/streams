import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useRoomProfileModalStore = create(
  combine(
    {
      showOptions: false,
      modalProfile: {} as RoomParticipant,
    },
    set => ({
      setOptions: (val: boolean) => {
        set(s => {
          return {
            showOptions: val,
          };
        });
      },
      setModalUser: (participant: RoomParticipant) => {
        set(s => {
          return {
            modalProfile: participant,
          };
        });
      },
    })
  )
);
