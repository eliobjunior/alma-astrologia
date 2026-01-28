// src/services/api.ts
import axios, { AxiosError } from "axios";

/**
 * Base URL do backend:
 * - Local: defina VITE_API_URL=http://localhost:3000
 * - Produção: defina VITE_API_URL=https://api.almaliraramos.com.br
 */
const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "http://localhost:3000";

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

/**
 * Interceptor de erro (debug)
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.baseURL
      ? `${error.config.baseURL}${error.config.url || ""}`
      : error.config?.url;

    // eslint-disable-next-line no-console
    console.error("[API ERROR]", {
      message: error.message,
      status,
      url,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);