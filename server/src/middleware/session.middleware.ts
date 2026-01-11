import RedisStore from "connect-redis";
import { redisClient } from "../config/redis";

const REDIS_STORE = new RedisStore({
  client: redisClient,
  prefix: "streams:",
});

export const sessionMiddleware = {
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  store: REDIS_STORE,
  cookie: {
    maxAge: 72 * 60 * 60 * 1000,
  },
};
