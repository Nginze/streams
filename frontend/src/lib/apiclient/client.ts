import axios from "axios";
const isTunnel = false;
export const apiClient = axios.create({
  baseURL: isTunnel ? "https://drop.up.railway.app" : "http://localhost:8000",
  withCredentials: true,
});
