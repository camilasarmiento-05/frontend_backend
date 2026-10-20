export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const errMsg = (e) =>
  e.response?.data?.errors?.join(". ") || e.response?.data?.msg || "No se pudo conectar con el servidor";

export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const fmt = (n, dec = 0) =>
  Number(n).toLocaleString("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const TINY = new Set(["de", "del", "la", "las", "los", "y", "e", "en", "el", "a", "o"]);
export const titulo = (s) =>
  String(s || "").toLowerCase().split(/\s+/).filter(Boolean)
    .map((w, i) => (i && TINY.has(w) ? w : w[0].toUpperCase() + w.slice(1))).join(" ");

export const iniciales = (s) =>
  String(s || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
export function hace(f) {
  const s = (new Date(f) - Date.now()) / 1000, a = Math.abs(s);
  if (isNaN(s)) return "";
  if (a < 60) return "justo ahora";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 2592000) return rtf.format(Math.round(s / 86400), "day");
  return rtf.format(Math.round(s / 2592000), "month");
}
