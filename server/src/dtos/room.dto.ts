import { z } from "zod";

export const createRoomSchema = z.object({
  body: z.object({
    roomDesc: z.string().min(1, "Room description is required"),
    isPrivate: z.boolean(),
    autoSpeaker: z.boolean(),
    chatEnabled: z.boolean(),
    handRaiseEnabled: z.boolean(),
    categories: z.array(z.string()).min(1, "At least one category is required"),
  }),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
