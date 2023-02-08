import pg from "pg";
export const client = new pg.Client({
  host: "localhost",
  port: 5432,
  password: "guuk12jona",
  user: "postgres",
  database: "drop",
});

client
  .connect()
  .then(() => console.log("[psql]: Connected to database"))
  .catch(err => console.log("[psql]: Couldn't connect to database", err));

client.on("error", () => console.log());
