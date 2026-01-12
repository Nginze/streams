-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "user_data" (
	"user_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_name" varchar,
	"email" varchar,
	"display_name" varchar,
	"avatar_url" varchar,
	"bio" text,
	"current_room_id" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_seen" timestamp with time zone,
	CONSTRAINT "user_data_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_provider" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"google_id" varchar,
	"github_id" varchar,
	"discord_id" varchar
);
--> statement-breakpoint
CREATE TABLE "room" (
	"room_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"creator_id" uuid,
	"room_desc" text,
	"is_private" boolean,
	"auto_speaker" boolean,
	"chat_enabled" boolean,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"hand_raise_enabled" boolean,
	"last_active" timestamp,
	"ended" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_notification" (
	"notification_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"room_id" uuid,
	"category" varchar,
	"content" varchar,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_category" (
	"room_id" uuid NOT NULL,
	"category" varchar NOT NULL,
	CONSTRAINT "room_category_pkey" PRIMARY KEY("room_id","category")
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"user_id" uuid NOT NULL,
	"is_following" uuid NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "user_follows_pkey" PRIMARY KEY("user_id","is_following")
);
--> statement-breakpoint
CREATE TABLE "room_ban" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ban_type" varchar,
	"created_at" timestamp,
	CONSTRAINT "room_ban_pkey" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "room_status" (
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"is_speaker" boolean,
	"is_mod" boolean,
	"raised_hand" boolean,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_muted" boolean,
	CONSTRAINT "room_status_pkey" PRIMARY KEY("user_id","room_id")
);
--> statement-breakpoint
ALTER TABLE "auth_provider" ADD CONSTRAINT "auth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user_data"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."room"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_category" ADD CONSTRAINT "room_category_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."room"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_is_following_fkey" FOREIGN KEY ("is_following") REFERENCES "public"."user_data"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_ban" ADD CONSTRAINT "room_ban_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."room"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_ban" ADD CONSTRAINT "room_ban_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_status" ADD CONSTRAINT "room_status_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."room"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_status" ADD CONSTRAINT "room_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id") ON DELETE no action ON UPDATE no action;
*/