import { pgTable, unique, uuid, varchar, text, timestamp, foreignKey, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const userData = pgTable("user_data", {
	userId: uuid("user_id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userName: varchar("user_name"),
	email: varchar(),
	displayName: varchar("display_name"),
	avatarUrl: varchar("avatar_url"),
	bio: text(),
	currentRoomId: uuid("current_room_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastSeen: timestamp("last_seen", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("user_data_email_key").on(table.email),
]);

export const authProvider = pgTable("auth_provider", {
	userId: uuid("user_id").primaryKey().notNull(),
	googleId: varchar("google_id"),
	githubId: varchar("github_id"),
	discordId: varchar("discord_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userData.userId],
			name: "auth_provider_user_id_fkey"
		}),
]);

export const room = pgTable("room", {
	roomId: uuid("room_id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	creatorId: uuid("creator_id"),
	roomDesc: text("room_desc"),
	isPrivate: boolean("is_private"),
	autoSpeaker: boolean("auto_speaker"),
	chatEnabled: boolean("chat_enabled"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	handRaiseEnabled: boolean("hand_raise_enabled"),
	lastActive: timestamp("last_active", { mode: 'string' }),
	ended: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [userData.userId],
			name: "room_creator_id_fkey"
		}),
]);

export const userNotification = pgTable("user_notification", {
	notificationId: uuid("notification_id").default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	roomId: uuid("room_id"),
	category: varchar(),
	content: varchar(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [room.roomId],
			name: "user_notification_room_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userData.userId],
			name: "user_notification_user_id_fkey"
		}).onDelete("cascade"),
]);

export const roomCategory = pgTable("room_category", {
	roomId: uuid("room_id").notNull(),
	category: varchar().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [room.roomId],
			name: "room_category_room_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.roomId, table.category], name: "room_category_pkey"}),
]);

export const userFollows = pgTable("user_follows", {
	userId: uuid("user_id").notNull(),
	isFollowing: uuid("is_following").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.isFollowing],
			foreignColumns: [userData.userId],
			name: "user_follows_is_following_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userData.userId],
			name: "user_follows_user_id_fkey"
		}),
	primaryKey({ columns: [table.userId, table.isFollowing], name: "user_follows_pkey"}),
]);

export const roomBan = pgTable("room_ban", {
	roomId: uuid("room_id").notNull(),
	userId: uuid("user_id").notNull(),
	banType: varchar("ban_type"),
	createdAt: timestamp("created_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [room.roomId],
			name: "room_ban_room_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userData.userId],
			name: "room_ban_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.roomId, table.userId], name: "room_ban_pkey"}),
]);

export const roomStatus = pgTable("room_status", {
	userId: uuid("user_id").notNull(),
	roomId: uuid("room_id").notNull(),
	isSpeaker: boolean("is_speaker"),
	isMod: boolean("is_mod"),
	raisedHand: boolean("raised_hand"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isMuted: boolean("is_muted"),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [room.roomId],
			name: "room_status_room_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userData.userId],
			name: "room_status_user_id_fkey"
		}),
	primaryKey({ columns: [table.userId, table.roomId], name: "room_status_pkey"}),
]);
