import { z } from "zod";

// Create room
export const createRoomSchema = z.object({
  roomDesc: z.string().min(1, "Room description is required").max(50, "Room description exceeds maximum length"),
  isPrivate: z.boolean(),
  autoSpeaker: z.boolean(),
  chatEnabled: z.boolean(),
  handRaiseEnabled: z.boolean(),
  categories: z.array(z.string()).min(2, "At least 2 categories are required").max(3, "Maximum 3 categories allowed"),
});

// Params validation
export const roomIdParamSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const roomStatusParamsSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  userId: z.string().uuid("Invalid user ID"),
});

// Query validation
export const joinRoomQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  hasJoined: z.string().optional(),
});

export const leaveRoomQuerySchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  userId: z.string().uuid("Invalid user ID").optional(),
});

export const updateRoomStatusQuerySchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  state: z.enum(["isSpeaker", "isMod", "raisedHand", "isMuted"]),
  value: z.enum(["true", "false"]),
});

export const updateRoomSettingsQuerySchema = z.object({
  state: z.enum(["chatEnabled", "handRaiseEnabled", "autoSpeaker", "isPrivate", "roomDesc"]),
  value: z.string().min(1, "Value is required"),
});

export const banQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  banType: z.string().min(1, "Ban type is required"),
});

// Type exports
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RoomIdParam = z.infer<typeof roomIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type RoomStatusParams = z.infer<typeof roomStatusParamsSchema>;
export type JoinRoomQuery = z.infer<typeof joinRoomQuerySchema>;
export type LeaveRoomQuery = z.infer<typeof leaveRoomQuerySchema>;
export type UpdateRoomStatusQuery = z.infer<typeof updateRoomStatusQuerySchema>;
export type UpdateRoomSettingsQuery = z.infer<typeof updateRoomSettingsQuerySchema>;
export type BanQuery = z.infer<typeof banQuerySchema>;
