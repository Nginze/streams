import {
  ErrorRequestHandler,
  RequestHandler
} from "express";
import createHttpError, { isHttpError } from "http-errors";
import { logger } from "../config/logger";

export const notFoundHandler: RequestHandler = (req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  logger.error(error);

  let statusCode = 500;
  let errorMessage = "Internal server error";

  if (isHttpError(error)) {
    statusCode = error.statusCode;
    errorMessage = error.message;
  }

  res.status(statusCode).json({
    error: {
      message: errorMessage,
    },
  });
};
