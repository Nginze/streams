import { UserDTO } from "../../../types/User";

export const wsAuthMiddleware = (socket: any, next: any) => {
  const user: UserDTO = (socket.request as any).user;

  if (!user) {
    return next(new Error("User not authenticated"));
  }

  next();
};
