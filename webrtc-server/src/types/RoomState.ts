import { Router, Worker } from "mediasoup/node/lib/types";
import { Peer } from "./Peer";

export type Then<T> = T extends PromiseLike<infer U> ? U : T;

export type RoomState = Record<string, Peer>;

export type Rooms = Record<
  string,
  { worker: Worker; router: Router; state: RoomState }
>;
