import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 1000,
  withCredentials: true,
});
