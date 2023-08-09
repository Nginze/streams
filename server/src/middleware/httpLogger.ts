import morgan, { StreamOptions } from "morgan";
import { logger } from "../config/logger";

const stream: StreamOptions = {
  write: (message: string) => logger.http(`${message}`),
};

export const httpLogger = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms",
  { stream }
);
