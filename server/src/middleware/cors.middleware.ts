import { CorsOptions } from "cors";
import "dotenv/config";

export const corsMiddleware: CorsOptions = {
  origin: process.env.CLIENT_URI,
  credentials: true,
};
