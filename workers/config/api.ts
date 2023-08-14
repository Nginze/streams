import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.NODE_ENV == "development"
      ? process.env.DEV_API
      : process.env.PROD_API,
  withCredentials: true,
});