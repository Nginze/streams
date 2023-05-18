import passport from "passport";
import * as dotenv from "dotenv";
import {
  Profile,
  Strategy as GithubStrategy,
  StrategyOptions,
} from "passport-github2";
import { pool } from "../config/psql";
import { user } from "../types/user";

dotenv.config();
const githubStrategyMiddleware = new GithubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user"],
  } as StrategyOptions,
  (accessToken: string, refreshToken: string, profile: any, done: any) => {
    pool
      .query(`select * from "user" where githubid = $1`, [profile.id])
      .then(async (result: any) => {
        console.log(result);
        if (result.rows.length !== 0) {
          done(null, result.rows[0]);
        } else {
          console.log("here");
          if (profile.photos && profile.emails) {
            console.log("inserted data");
            pool
              .query(
                `insert into "user" (githubid, email, username, avatarurl, displayname, bio) values ($1, $2, $3, $4, $5, $6) returning userid, githubid, email, username, avatarurl, displayname, bio `,
                [
                  profile.id,
                  profile.emails[0].value,
                  profile.username,
                  profile.photos[0].value,
                  profile.displayName,
                  profile._json.bio,
                ]
              )
              .then(result => done(null, result.rows[0]));
          }
        }
      });
  }
);

const serializeMiddleware = (user: Partial<user>, done: any) => {
  done(null, user.userid);
};

const deserializeMiddleware = async (userId: string, done: any) => {
  pool
    .query(
      `select userid, email, username, avatarurl, displayname, bio from "user" where userId = $1`,
      [userId]
    )
    .then(result => done(null, result.rows[0]))
    .catch(err => done(err, null));
};

passport.use(githubStrategyMiddleware);
passport.serializeUser(serializeMiddleware);
passport.deserializeUser(deserializeMiddleware);
