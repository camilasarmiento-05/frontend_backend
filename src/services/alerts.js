import Swal from "sweetalert2";
import { esc, errMsg } from "@/utils/format";

// Todas las alertas de la app usan SweetAlert2 (nada de alert/confirm de window).
const base = { confirmButtonColor: "#39A900", cancelButtonColor: "#6b7a72", confirmButtonText: "Entendido" };
export const S = Swal.mixin(base);
const Toast = Swal.mixin({
  ...base, toast: true, position: "top-end", showConfirmButton: false, timer: 3800, timerProgressBar: true,
  didOpen: (t) => { t.onmouseenter = Swal.stopTimer; t.onmouseleave = Swal.resumeTimer; }
});

export const toast = (msg, type = "ok") => Toast.fire({ icon: type === "bad" ? "error" : "success", title: msg });
export const fail = (title, text) => S.fire({ icon: "error", title, text });

export const avisar = (lista, despues) =>
  S.fire({ icon: "warning", title: "Revisa los datos", html: `<ul class="swal-list">${lista.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` })
    .then(() => despues && despues());

export async function confirmar(title, msg, ok, onOk, danger) {
  const r = await S.fire({
    title, text: msg, icon: danger ? "warning" : "question", showCancelButton: true, confirmButtonText: ok,
    cancelButtonText: "Cancelar", reverseButtons: true, focusCancel: !!danger, showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async () => {
      try { return (await onOk()) ?? true; }
      catch (e) { Swal.showValidationMessage(errMsg(e)); return false; }
    }
  });
  if (r.isConfirmed && typeof r.value === "string") toast(r.value);
}

export { Swal };
