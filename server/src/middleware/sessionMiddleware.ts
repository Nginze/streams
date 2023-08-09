import session, { SessionOptions } from "express-session";
import Store from "connect-redis";
import { redisClient } from "../config/redis";

const RedisStore = Store(session);

export const sessionMiddleware: SessionOptions = {
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 72 * 60 * 60 * 1000,
  },
};
