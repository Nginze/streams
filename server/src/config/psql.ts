import { Pool } from "pg";
import "dotenv/config";
import { logger } from "./logger";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT as number | undefined,
  password: process.env.PGPASSWORD,
  user:
    process.env.NODE_ENV == "production"
      ? process.env.PGUSER_PROD
      : process.env.PGUSER,
  database:
    process.env.NODE_ENV == "production"
      ? process.env.PGDATABASE_PROD
      : process.env.PGDATABASE,
  max: 20,
});

pool.on("error", (err, client) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});
