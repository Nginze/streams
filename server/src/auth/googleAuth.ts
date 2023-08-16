import "dotenv/config";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  StrategyOptions,
} from "passport-google-oauth20";
import { pool } from "../config/psql";
import { UserDTO } from "../types/User";
import { logger } from "../config/logger";
import { generateUsername } from "../utils/generateUsername";

const parseToUserDTO = (params: Record<any, any>): UserDTO => {
  const parsed = {
    userId: params.user_id,
    email: params.email,
    userName: params.user_name,
    avatarUrl: params.avatar_url,
    displayName: params.display_name,
    bio: params.bio,
    currentRoomId: params.current_room_id,
    lastSeen: params.last_seen,
    createdAt: params.created_at,
  };

  return parsed;
};

const googleStrategyMiddleware = new GoogleStrategy(
  {
    clientID:
      process.env.NODE_ENV == "production"
        ? process.env.GOOGLE_CLIENT_ID_PROD
        : process.env.GOOGLE_CLIENT_ID_PROD,
    clientSecret:
      process.env.NODE_ENV == "production"
        ? process.env.GOOGLE_CLIENT_SECRET_PROD
        : process.env.GOOGLE_CLIENT_SECRET_PROD,
    callbackURL:
      process.env.NODE_ENV == "production"
        ? process.env.GOOGLE_CALLBACK_URL_PROD
        : process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
  } as StrategyOptions,
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any
  ) => {
    const { rows } = await pool.query(
      `
      SELECT u.*, ap.google_id
      FROM user_data u
      JOIN auth_provider ap ON u.user_id = ap.user_id 
      WHERE ap.google_id = $1 or u.email = $2;
      `,
      [profile.id, profile.emails[0].value]
    );
    if (rows.length > 0) {
      const parsedUser = parseToUserDTO(rows[0]);
      done(null, parsedUser);
    } else {
      if (profile.photos && profile.emails) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const { rows: userDataRows } = await client.query(
            `
            INSERT INTO user_data (email, user_name, avatar_url, display_name, bio)
              VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
              profile.emails[0].value,
              generateUsername(profile._json.family_name.toLowerCase()), //generte unique handle by default
              profile.photos[0].value,
              profile.displayName,
              profile._json.bio,
            ]
          );
          const { rows: authProviderRows } = await client.query(
            `
            INSERT INTO auth_provider (user_id, google_id)
            VALUES ($1, $2)
            RETURNING google_id 
            `,
            [userDataRows[0].user_id, profile.id]
          );

          await client.query("COMMIT");

          const unParsedUserData = {
            ...userDataRows[0],
            google_id: authProviderRows[0].google_id,
          };

          const parsedUserData = parseToUserDTO(unParsedUserData);

          done(null, parsedUserData);
        } catch (err) {
          await client.query("ROLLBACK");
          logger.log({ level: "error", message: `${err}` });
          throw err;
        } finally {
          client.release();
        }
      }
    }
  }
);

const serializeMiddleware = (user: Partial<UserDTO>, done: any) => {
  done(null, user.userId);
};

const deserializeMiddleware = async (userId: string, done: any) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT u.*, ap.google_id
      FROM user_data u
      JOIN auth_provider ap
      ON u.user_id = ap.user_id
      WHERE u.user_id = $1;
      `,
      [userId]
    );
    const parsedUserData = parseToUserDTO(rows[0]);
    done(null, parsedUserData);
  } catch (err) {
    logger.log({ level: "error", message: `${err}` });
    done(err, null);
  }
};

passport.use(googleStrategyMiddleware);
passport.serializeUser(serializeMiddleware);
passport.deserializeUser(deserializeMiddleware);
