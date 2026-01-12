import { relations } from "drizzle-orm/relations";
import { userData, authProvider, room, userNotification, roomCategory, userFollows, roomBan, roomStatus } from "./schema";

export const authProviderRelations = relations(authProvider, ({one}) => ({
	userDatum: one(userData, {
		fields: [authProvider.userId],
		references: [userData.userId]
	}),
}));

export const userDataRelations = relations(userData, ({many}) => ({
	authProviders: many(authProvider),
	rooms: many(room),
	userNotifications: many(userNotification),
	userFollows_isFollowing: many(userFollows, {
		relationName: "userFollows_isFollowing_userData_userId"
	}),
	userFollows_userId: many(userFollows, {
		relationName: "userFollows_userId_userData_userId"
	}),
	roomBans: many(roomBan),
	roomStatuses: many(roomStatus),
}));

export const roomRelations = relations(room, ({one, many}) => ({
	userDatum: one(userData, {
		fields: [room.creatorId],
		references: [userData.userId]
	}),
	userNotifications: many(userNotification),
	roomCategories: many(roomCategory),
	roomBans: many(roomBan),
	roomStatuses: many(roomStatus),
}));

export const userNotificationRelations = relations(userNotification, ({one}) => ({
	room: one(room, {
		fields: [userNotification.roomId],
		references: [room.roomId]
	}),
	userDatum: one(userData, {
		fields: [userNotification.userId],
		references: [userData.userId]
	}),
}));

export const roomCategoryRelations = relations(roomCategory, ({one}) => ({
	room: one(room, {
		fields: [roomCategory.roomId],
		references: [room.roomId]
	}),
}));

export const userFollowsRelations = relations(userFollows, ({one}) => ({
	userDatum_isFollowing: one(userData, {
		fields: [userFollows.isFollowing],
		references: [userData.userId],
		relationName: "userFollows_isFollowing_userData_userId"
	}),
	userDatum_userId: one(userData, {
		fields: [userFollows.userId],
		references: [userData.userId],
		relationName: "userFollows_userId_userData_userId"
	}),
}));

export const roomBanRelations = relations(roomBan, ({one}) => ({
	room: one(room, {
		fields: [roomBan.roomId],
		references: [room.roomId]
	}),
	userDatum: one(userData, {
		fields: [roomBan.userId],
		references: [userData.userId]
	}),
}));

export const roomStatusRelations = relations(roomStatus, ({one}) => ({
	room: one(room, {
		fields: [roomStatus.roomId],
		references: [room.roomId]
	}),
	userDatum: one(userData, {
		fields: [roomStatus.userId],
		references: [userData.userId]
	}),
}));