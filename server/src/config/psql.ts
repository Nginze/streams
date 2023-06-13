import {Pool} from "pg";
import  "dotenv/config";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT as number | undefined,
  password: process.env.PGPASSWORD,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  max: 20,
});
