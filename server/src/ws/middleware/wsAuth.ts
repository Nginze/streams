import { Socket } from "socket.io";
import { UserDTO } from "../../types/User";

export const wsAuthMiddleware = (socket: Socket, next: any) => {
  //@ts-ignore
  const user: UserDTO = socket.request?.user;

  if (!user) {
    const error = new Error("Unauthorized connection to ws");
    return next(error);
  }

  next();
};
