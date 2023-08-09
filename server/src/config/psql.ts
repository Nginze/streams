import {Pool} from "pg";
import  "dotenv/config";
import { logger } from "./logger";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT as number | undefined,
  password: process.env.PGPASSWORD,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  max: 20,
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err)
  process.exit(-1)
})
