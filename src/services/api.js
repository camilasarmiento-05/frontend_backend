import axios from "axios";
import { auth } from "@/stores/auth";

/**
 * URL base de la API.
 *
 * El error clásico: dejar "http://localhost:4500/api" escrito a mano. "localhost" significa
 * "ESTE computador"; si abres la página desde otro equipo, desde el celular o cambias de
 * red (otra IP), el navegador busca el backend en el lugar equivocado y todo falla.
 *
 * Solución (en orden):
 *  1. Sin VITE_API_URL  -> "/api" (relativa): siempre apunta al mismo servidor de la página.
 *     En desarrollo Vite la reenvía al backend (ver vite.config.js).
 *  2. Con VITE_API_URL  -> se usa tal cual, pero si trae "localhost" y la página se abrió
 *     con otra IP/host, se reemplaza por el host actual para que no se rompa.
 */
function resolveBaseURL() {
  const env = (import.meta.env.VITE_API_URL || "").trim();
  if (!env) return "/api";
  try {
    const url = new URL(env, window.location.origin);
    const local = ["localhost", "127.0.0.1", "::1"];
    if (local.includes(url.hostname) && !local.includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return env;
  }
}

export const API_URL = resolveBaseURL();

// Una sola instancia de axios para toda la app.
const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// Inyecta el token en cada petición.
api.interceptors.request.use((config) => {
  if (auth.token) config.headers["x-token"] = auth.token;
  return config;
});

// 401 = token vencido o inválido: se avisa a App.vue para cerrar la sesión.
api.interceptors.response.use(
  (r) => r,
  (e) => {
    const esLogin = String(e.config?.url || "").includes("/usuarios/login");
    if (e.response?.status === 401 && auth.token && !esLogin) {
      window.dispatchEvent(new Event("sena:unauthorized"));
    }
    return Promise.reject(e);
  }
);

export default api;
