import { CorsOptions } from "cors";
import "dotenv/config";

export const corsMiddleware: CorsOptions = {
  origin:
    process.env.NODE_ENV == "production"
      ? process.env.CLIENT_URI_PROD
      : process.env.CLIENT_URI,
  credentials: true,
};
