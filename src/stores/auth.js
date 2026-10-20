import { reactive } from "vue";

const leerUsuario = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};

// Estado de sesión compartido (token + usuario), guardado también en localStorage.
export const auth = reactive({
  token: localStorage.getItem("token") || "",
  user: leerUsuario()
});

export const isLogged = () => !!(auth.token && auth.user);

export function setSession(token, user) {
  auth.token = token;
  auth.user = user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  auth.token = "";
  auth.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
