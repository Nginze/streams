import { RequestHandler } from "express";

export const authMiddleware: RequestHandler = (req, res, next) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.includes("/room/leave") ||
    req.originalUrl.includes("/room/destroy") ||
    req.originalUrl.includes("/ping") ||
    req.originalUrl.includes("/soft-delete")
  ) {
    next();
  } else if (req.user) {
    next();
  } else {
    res.status(401).json({
      error: {
        message: "Unauthorized request for resource",
      },
    });
  }
};
