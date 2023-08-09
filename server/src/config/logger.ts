import { addColors, transports, format, createLogger } from "winston";

const config = {
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4},
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "cyan",
    debug: "white",
  },
};

addColors(config.colors);

const transport =
  process.env.NODE_ENV !== "production"
    ? new transports.Console()
    : new transports.File({ filename: "file.log" });

const f = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.colorize({ all: true }),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

export const logger = createLogger({
  level: "debug",
  levels: config.levels,
  format: f,
  transports: [transport],
});
