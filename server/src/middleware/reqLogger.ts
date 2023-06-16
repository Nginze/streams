import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const reqLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, params, query, body, headers } = req;
  logger.log({
    level: "info",
    message: `[${method}]/ ${url}/${params}?${query}`,
  });

  next()
};
