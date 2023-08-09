import { useVoiceStore } from "@/engine/webrtc/store/useVoiceStore";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useSettingStore } from "./useSettingStore";

export const soundEffects = {
  roomChatMention: "roomChatMention.wav",
  unmute: "unmute.wav",
  mute: "mute.wav",
  roomInvite: "roomInvite.wav",
  deafen: "deafen.wav",
  undeafen: "undeafen.wav",
};

export const useSoundEffectStore = create(
  combine(
    {
      audioRefMap: {} as Record<string, HTMLAudioElement>,
    },
    (set, get) => ({
      playSoundEffect: (se: keyof typeof soundEffects) => {
        const { audioRefMap } = get();
        const { soundEffects: fxOn } = useSettingStore.getState();
        if (fxOn) {
          audioRefMap[se]?.play();
        }
      },

      add: (key: string, audio: HTMLAudioElement) => {
        set(s => ({ audioRefMap: { ...s.audioRefMap, [key]: audio } }));
      },
    })
  )
);
