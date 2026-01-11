import axios from "axios";

export const api = axios.create({
  baseURL:
    process.env.NODE_ENV == "development"
      ? `${process.env.NEXT_PUBLIC_DEV_API}/api`
      : `${process.env.NEXT_PUBLIC_PROD_API}/api`,
  withCredentials: true,
});
