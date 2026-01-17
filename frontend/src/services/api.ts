import axios from "axios";

export const api = axios.create({
  baseURL: "https://api.almaliraramos.com.br",
  headers: {
    "Content-Type": "application/json",
  },
});