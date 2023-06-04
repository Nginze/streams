import { addColors, transports, format, createLogger } from "winston";

const { combine, colorize, simple, prettyPrint } = format;

const logLevels = {
  levels: { critical: 0, error: 1, warning: 2, debug: 3, info: 4 },
  colors: {
    critical: "bold magenta",
    error: "bold red",
    warning: "bold yellow",
    info: "bold blue",
    debug: "bold green",
  },
};

addColors(logLevels.colors);

const transport =
  process.env.NODE_ENV !== "production"
    ? new transports.Console({
        format: combine(colorize(), simple()),
      })
    : new transports.File({ filename: "file.log" });

export const logger = createLogger({
  levels: logLevels.levels,
  format: prettyPrint(),
  transports: [transport],
});
