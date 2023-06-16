import Store from "connect-redis";
import cors, { CorsOptions } from "cors";
import "dotenv/config";
import express from "express";
import session, { SessionOptions } from "express-session";
import http from "http";
import passport from "passport";
import { Server } from "socket.io";
import { router as authRoutes } from "./api/authRoutes";
import { router as roomRoutes } from "./api/roomRoutes";
import { router as rootRoutes } from "./api/rootRoutes";
import { router as userRoutes } from "./api/userRoutes";
import { logger } from "./config/logger";
import { redisClient } from "./config/redis";
import { authMiddleware } from "./middleware/authMiddleware";
import { internalErrorMiddleware } from "./middleware/internalError";
import { main } from "./modules/ws/main";
import { wrap } from "./utils/wrap";
import { reqLogger } from "./middleware/reqLogger";
import "./jobs/cron";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URI,
    credentials: true,
  },
});

const RedisStore = Store(session);

const corsMiddleware: CorsOptions = {
  origin: process.env.CLIENT_URI,
  credentials: true,
};

const sessionMiddleware: SessionOptions = {
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 72 * 60 * 60 * 1000,
  },
};

app.use(cors(corsMiddleware));
app.use(session(sessionMiddleware));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(internalErrorMiddleware);
app.use(authMiddleware);
app.use(reqLogger);

app.use("/", rootRoutes);
app.use("/auth", authRoutes);
app.use("/room", roomRoutes);
app.use("/profile", userRoutes);

io.use(wrap(session(sessionMiddleware)));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

server.listen(process.env.PORT || 8000, () => {
  logger.info(`listening on port 8000`);
});

(async function () {
  try {
    await main(io);
  } catch (err) {
    logger.log({ level: "error", message: `${err}` });
  }
})();
