import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// En desarrollo el navegador le habla a Vite (puerto 5173) y Vite reenvía todo lo
// que empiece por /api al backend. Así el frontend NUNCA necesita saber la IP del
// backend: funciona con localhost, con la IP de la red o con la de otro computador.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.BACKEND_URL || "http://localhost:4500";
  const proxy = { "/api": { target: backend, changeOrigin: true } };

  return {
    plugins: [vue()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    // host: true => escucha en todas las interfaces (se puede abrir con http://TU-IP:5173)
    server: { host: true, port: 5173, proxy },
    preview: { host: true, port: 5173, proxy }
  };
});
