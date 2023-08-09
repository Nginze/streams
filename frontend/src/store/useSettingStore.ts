import { create } from "zustand";
import { combine, persist, createJSONStorage } from "zustand/middleware";

export const useSettingStore = create(
  persist(
    combine(
      {
        roomInvites: false,
        soundEffects: false,
        selectedMicDevice: "default",
        micAsObj: {value: 'default', label: 'Default - Microphone (Realtek(R) Audio)'},
      },
      set => ({
        updateRoomInvites(val: boolean) {
          set(s => {
            return { roomInvites: val };
          });
        },
        updateSoundEffects(val: boolean) {
          set(s => {
            return { soundEffects: val };
          });
        },

        updateSelectedMic(device: any) {
          console.log(device.value);
          set(s => {
            return {
              micAsObj: device,
              selectedMicDevice: device.value,
            };
          });
        },
        set,
      })
    ),
    {
      name: "streams-user-preferences",
    }
  )
);
