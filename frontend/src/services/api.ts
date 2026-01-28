// src/services/api.ts
import axios, { AxiosError } from "axios";

/**
 * Base URL do backend:
 * - Local: defina VITE_API_URL=http://localhost:3333
 * - Produção: defina VITE_API_URL=https://api.almaliraramos.com.br
 */
const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "http://localhost:3333";

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Se você NÃO usa cookies/sessão, deixe false (padrão).
  // Se algum dia for usar sessão via cookie entre domínios, mude para true
  // e ajuste CORS no backend (credentials).
  withCredentials: false,
});

/**
 * Interceptor de erro (opcional, mas ajuda MUITO a debugar)
 * - Mostra status, url e response.data quando existir.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.baseURL
      ? `${error.config.baseURL}${error.config.url || ""}`
      : error.config?.url;

    // Log detalhado pra você enxergar no console do browser
    // sem quebrar o fluxo do app.
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