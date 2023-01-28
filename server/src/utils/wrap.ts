import { NextFunction } from "express";
import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export const wrap =
  (middleware: any) =>
  (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    next: (err?: ExtendedError | undefined) => void
  ) =>
    middleware(socket.request, {}, next);
