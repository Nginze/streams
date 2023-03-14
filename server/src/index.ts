import express, { Request, Response } from "express";
import { Socket, Server } from "socket.io";
import { redisClient } from "./config/redis";
import http from "http";
import passport from "passport";
import session, { SessionOptions } from "express-session";
import Store from "connect-redis";
import cors, { CorsOptions } from "cors";
import * as dotenv from "dotenv";
import { router as authRoutes } from "./api/authRoutes";
import { router as roomRoutes } from "./api/roomRoutes";
import "./config/redis";
import "./config/psql";
import "./config/rabbit";
import { main } from "./modules/ws/main";
import { wrap } from "./utils/wrap";

const isTunnel = true;
const isProduction = process.env.NODE_ENV === "production";
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: isProduction ? process.env.TUNNEL_URI : process.env.CLIENT_URI,
    credentials: true,
  },
});

const RedisStore = Store(session);

const corsMiddleware: CorsOptions = {
  origin: isTunnel ? process.env.TUNNEL_URI : process.env.CLIENT_URI,
  credentials: true,
};

const sessionMiddleware: SessionOptions = {
  secret: "secret",
  resave: false,
  saveUninitialized: true,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
    httpOnly: false,
  },
};

app.use(cors(corsMiddleware));
app.use(session(sessionMiddleware));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/auth", authRoutes);
app.use("/room", roomRoutes);

io.use(wrap(session(sessionMiddleware)));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

app.get("/", (req: Request, res: Response) => {
  console.log("user: ", req.user);
  res.send("[Drop]: Get the fuck outta here!");
});

app.get("/user", (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

// app.listen(process.env.PORT, () => {
//   console.log(`[server]: listening on port ${process.env.PORT}`);
// });

server.listen(process.env.PORT || 8000, () => {
  console.log(`[socket && server]: listening on port 8000`);
});

main(io);
