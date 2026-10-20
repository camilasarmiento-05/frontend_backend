import { reactive } from "vue";
import api from "@/services/api";
import { VIEWS } from "@/config/views";

// Listas compartidas entre vistas (null = todavía no se han cargado).
export const store = reactive({ usuarios: null, aprendices: null, cursos: null });

export async function load(k) {
  const { data } = await api.get(VIEWS[k].url);
  store[k] = data;
  return data;
}

export const loadAll = () => Promise.allSettled(Object.keys(VIEWS).map(load));

export function resetStore() {
  Object.keys(store).forEach((k) => { store[k] = null; });
}
