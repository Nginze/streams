import axios from "axios";
const isTunnel = true
export const apiClient = axios.create({
  baseURL: isTunnel ? "https://enclosure-popularity-beads-amount.trycloudflare.com" :"http://localhost:8000",
  withCredentials: true,
});
