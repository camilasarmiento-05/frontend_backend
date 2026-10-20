<script setup>
// Selector de curso propio (la lista se abre dentro de la tarjeta, con teclado).
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({ modelValue: { type: String, default: "" }, options: { type: Array, default: () => [] } });
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const root = ref(null);
const lista = ref(null);
const seleccionado = computed(() => props.options.find((c) => c._id === props.modelValue));

function abrir(v) {
  open.value = v;
  if (v) setTimeout(() => {
    lista.value?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    lista.value?.querySelector("li.sel")?.scrollIntoView({ block: "nearest" });
  });
}
function elegir(c) {
  emit("update:modelValue", c._id);
  open.value = false;
  root.value?.querySelector(".dd-btn")?.focus();
}
function teclas(e) {
  const items = [...root.value.querySelectorAll("li[data-v]")];
  const li = e.target.closest?.("li[data-v]");
  if (e.key === "Escape" && open.value) { e.stopPropagation(); open.value = false; return; }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!open.value) open.value = true;
    const n = li ? items.indexOf(li) + (e.key === "ArrowDown" ? 1 : -1) : 0;
    setTimeout(() => root.value.querySelectorAll("li[data-v]")[Math.min(Math.max(n, 0), items.length - 1)]?.focus());
  } else if ((e.key === "Enter" || e.key === " ") && li) {
    e.preventDefault();
    li.click();
  }
}
const fuera = (e) => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false; };
onMounted(() => document.addEventListener("mousedown", fuera));
onBeforeUnmount(() => document.removeEventListener("mousedown", fuera));
</script>

<template>
  <div class="dd" ref="root" @keydown="teclas">
    <button type="button" class="dd-btn" aria-haspopup="listbox" :aria-expanded="String(open)" @click="abrir(!open)">
      <span class="dd-txt" :class="{ ph: !seleccionado }">
        {{ seleccionado ? seleccionado.codigo + " · " + seleccionado.nombre : "Selecciona un curso" }}
      </span>
      <Icon name="abajo" />
    </button>
    <ul class="dd-list" role="listbox" v-show="open" ref="lista">
      <li v-for="c in options" :key="c._id" role="option" tabindex="-1" :data-v="c._id"
          :class="{ sel: c._id === modelValue }" @click="elegir(c)">
        <strong>{{ c.codigo }}</strong><span>{{ c.nombre }}</span>
      </li>
      <li v-if="!options.length" class="none">No hay cursos activos</li>
    </ul>
  </div>
</template>
