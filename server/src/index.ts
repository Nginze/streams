import cors from "cors";
import express from "express";
import session from "express-session";
import http from "http";
import "dotenv/config";
import passport from "passport";
import { Server } from "socket.io";
import { router as authRoutes } from "./api/auth.routes";
import { router as roomRoutes } from "./api/room.routes";
import { router as rootRoutes } from "./api/root.routes";
import { router as userRoutes } from "./api/user.routes";
import { router as workerRoutes } from "./api/worker.routes";

import { logger } from "./config/logger";
import { corsMiddleware } from "./middleware/cors.middleware";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { httpLogger } from "./middleware/httpLogger";
import { sessionMiddleware } from "./middleware/session.middleware";
import { wrap } from "./utils/wrap";
import { setupWs } from "./ws";
import { limiter } from "./config/rate-limiter";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV == "production"
        ? process.env.CLIENT_URI_PROD
        : process.env.CLIENT_URI,
    credentials: true,
  },
});

app.use(cors(corsMiddleware));
app.use(session(sessionMiddleware));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(httpLogger);
// app.use(limiter)

app.use("/api/", rootRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/profile", userRoutes);
app.use("/api/worker", workerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

io.use(wrap(session(sessionMiddleware)));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

server.listen(process.env.PORT || 8000, () => {
  (async function () {
    try {
      setupWs(io);
    } catch (error) {
      logger.error(error);
    }
  })();
  logger.info(`listening on port ${process.env.PORT}`);
});
