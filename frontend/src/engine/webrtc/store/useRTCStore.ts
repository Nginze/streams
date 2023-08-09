import { create } from "zustand";
import { combine } from "zustand/middleware";

type RTCStatus = "connecting" | "connected" | "failed";
export const useRTCStore = create(
  combine(
    {
      createRoomLoading: false,
      rtcStatus: "connecting",
    },
    set => ({
      setCreateLoading: (val: boolean) => {
        set(s => ({
          createRoomLoading: val,
        }));
      },
      setRTCStatus: (status: RTCStatus) => {
        set(s => ({
          rtcStatus: status
        }));
      },
      set,
    })
  )
);
