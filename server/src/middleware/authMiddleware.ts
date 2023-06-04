import { NextFunction, Request, Response } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.originalUrl.startsWith("/auth")) {
    next();
  } else if (req.user) {
    next();
  } else {
    res.status(400).json({ error: "Authentication failed" });
  }
};
