import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();

export const client = new pg.Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT as number | undefined,
  password: process.env.PGPASSWORD,
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
});

client
  .connect()
  .then(() => console.log("[psql]: Connected to database"))
  .catch(err => console.log("[psql]: Couldn't connect to database", err));

client.on("error", () => console.log());
