import axios from "axios";
const isTunnel = true;
export const apiClient = axios.create({
  baseURL: isTunnel ? "https://drop.up.railway.app" : "http://localhost:8000",
  withCredentials: true,
});
