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
