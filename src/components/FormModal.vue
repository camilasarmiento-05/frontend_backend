<script setup>
// Formulario en ventana modal para crear/editar. Valida sin atributos HTML y avisa con SweetAlert2.
import { reactive, ref, computed, onMounted, onBeforeUnmount } from "vue";
import CursoSelect from "./CursoSelect.vue";
import { avisar, Swal } from "@/services/alerts";
import { emailOk } from "@/utils/format";

const props = defineProps({
  title: String,
  ok: String,
  fields: { type: Array, required: true },
  row: { type: Object, default: null },        // null = registro nuevo
  cursos: { type: Array, default: () => [] },
  submit: { type: Function, required: true }   // async (payload) => false para dejar abierto
});
const emit = defineEmits(["close"]);

const isNew = !props.row;
const raiz = ref(null);
const busy = ref(false);
const form = reactive({});
const bad = reactive({});
props.fields.forEach((f) => {
  const v = props.row ? (f.k === "curso" ? props.row.curso?._id : props.row[f.k]) : "";
  form[f.k] = v ?? "";
});

// Solo cursos activos (y el que ya tenía el aprendiz, aunque esté inactivo).
const opciones = computed(() => props.cursos.filter((c) => c.status === 0 || c._id === form.curso));

const plain = (l) => l.replace(/\s*\(.*\)/, "");
function validar() {
  const errs = [];
  props.fields.forEach((f) => {
    const v = String(form[f.k] ?? "").trim();
    let m = "";
    if (!v && !(f.k === "password" && !isNew)) m = "es obligatorio";
    else if (f.t === "email" && !emailOk(v)) m = "debe ser un correo válido, por ejemplo nombre@sena.edu.co";
    else if (f.t === "password" && v && v.length < 6) m = "debe tener al menos 6 caracteres";
    else if (f.t === "number" && !(Number(v) > 0)) m = "debe ser un número mayor que 0";
    bad[f.k] = !!m;
    if (m) errs.push(`${plain(f.l)} ${m}`);
  });
  if (errs.length) avisar(errs, () => raiz.value?.querySelector(".field.bad input:not([type=hidden]), .field.bad .dd-btn")?.focus());
  return !errs.length;
}

async function enviar() {
  if (!validar()) return;
  const payload = Object.fromEntries(props.fields.map((f) => [f.k, String(form[f.k] ?? "").trim()]));
  busy.value = true;
  try {
    if ((await props.submit(payload)) !== false) emit("close");
  } finally {
    busy.value = false;
  }
}

const tecla = (e) => { if (e.key === "Escape" && !Swal.isVisible()) emit("close"); };
onMounted(() => {
  document.addEventListener("keydown", tecla);
  (raiz.value?.querySelector("input:not([type=hidden])") || raiz.value?.querySelector("[type=submit]"))?.focus();
});
onBeforeUnmount(() => document.removeEventListener("keydown", tecla));
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @mousedown.self="emit('close')">
      <div class="modal" role="dialog" aria-modal="true" ref="raiz">
        <h3>{{ title }}</h3>
        <form novalidate @submit.prevent="enviar">
          <div v-for="f in fields" :key="f.k" class="field" :class="{ bad: bad[f.k] }">
            <label :for="'f-' + f.k">{{ f.l }}</label>
            <CursoSelect v-if="f.t === 'select'" v-model="form[f.k]" :options="opciones" @update:modelValue="bad[f.k] = false" />
            <input v-else :id="'f-' + f.k" :name="f.k" v-model="form[f.k]" autocomplete="off"
                   :type="f.t === 'password' ? 'password' : 'text'" :inputmode="f.t === 'number' ? 'numeric' : undefined"
                   @input="bad[f.k] = false">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn soft" @click="emit('close')">Cancelar</button>
            <button class="btn primary" type="submit" :disabled="busy">{{ ok }}</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
