import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const internalErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error occurred on route: ${req.method} ${req.originalUrl}`);
  logger.error("Request headers:", req.headers);
  logger.error("Request body:", req.body);
  logger.log({ level: "error", message: `${err}` });
  res.status(500).json({ error: "Internal Server Error" });
};
