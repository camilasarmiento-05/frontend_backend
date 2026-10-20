// Copia dist/ dentro de backend/public para que Express sirva el frontend en el puerto 4500.
// Uso: npm run deploy:backend
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");
const target = path.join(root, "..", "backend", "public");

if (!fs.existsSync(dist)) {
  console.error("No existe dist/. Ejecuta primero: npm run build");
  process.exit(1);
}
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(dist, target, { recursive: true });
console.log("Frontend copiado a backend/public. Inicia el backend y abre http://localhost:4500");
