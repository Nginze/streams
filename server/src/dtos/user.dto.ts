import { z } from "zod";

const userDTO = z.object({
  userId: z.string({ required_error: "user_id is required" }),
  email: z
    .string({ required_error: "email is required" })
    .email({ message: "Must be a valid email" }),
  userName: z.string({ required_error: "user_name is required" }),
  avatarUrl: z.string({ required_error: "avatar_url is required" }),
  displayName: z.string({ required_error: "display_name is required" }),
  bio: z.string({ required_error: "bio is required" }),
  currentRoomId: z.string(),
  googleId: z.string().optional(),
  githubId: z.string().optional(),
  discordId: z.string().optional(),
  lastSeen: z.string(),
  createdAt: z.string(),
});

// Follow user
export const followUserSchema = z.object({
  userToFollow: z.string().uuid("Invalid user ID"),
});

// Update bio
export const updateBioSchema = z.object({
  bio: z.string().max(500, "Bio exceeds maximum length of 500 characters"),
});

// Update avatar
export const updateAvatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
});

// Create notification
export const createNotificationSchema = z.object({
  category: z.enum(["room_invite", "room_mention", "follow", "system"]),
  content: z.string().min(1, "Content is required").max(255, "Content exceeds maximum length"),
  roomId: z.string().uuid("Invalid room ID"),
});

// Params validation
export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
});

export const userToUnfollowParamSchema = z.object({
  userToUnfollow: z.string().uuid("Invalid user ID"),
});

// Query validation
export const pingQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

// Type exports
export type FollowUserInput = z.infer<typeof followUserSchema>;
export type UpdateBioInput = z.infer<typeof updateBioSchema>;
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type UserToUnfollowParam = z.infer<typeof userToUnfollowParamSchema>;
export type PingQuery = z.infer<typeof pingQuerySchema>;
