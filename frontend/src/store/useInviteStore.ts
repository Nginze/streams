import { create } from "zustand";
import { combine } from "zustand/middleware";


export const useInviteStore = create(
  combine({ inviteLog: new Map() }, set => ({
    updateLastInvite(userId: string) {
      const currentTime = Math.floor(Date.now() / 1000);
      set(s => {
        const updatedInviteLog = new Map(s.inviteLog);
        updatedInviteLog.set(userId, currentTime);
        return { inviteLog: updatedInviteLog };
      });
    },
    set,
  }))
);
