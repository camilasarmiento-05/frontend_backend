<script setup>
// Listado genérico (usuarios, aprendices, cursos): búsqueda, crear, editar y activar/desactivar.
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import FormModal from "@/components/FormModal.vue";
import api from "@/services/api";
import { store, load } from "@/stores/data";
import { VIEWS } from "@/config/views";
import { toast, fail, confirmar } from "@/services/alerts";
import { errMsg } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const k = route.meta.key;
const v = VIEWS[k];

const q = ref(String(route.query.q || ""));
const cargando = ref(!store[k]);
const error = ref("");
const mostrarForm = ref(false);
const filaForm = ref(null); // null = nuevo registro

const todos = computed(() => store[k] || []);
const filas = computed(() => {
  const term = q.value.toLowerCase();
  return todos.value.filter((r) =>
    !term || JSON.stringify(Object.values(r)).toLowerCase().includes(term) || (r.curso?.nombre || "").toLowerCase().includes(term));
});
const camposForm = computed(() => v.fields.filter((f) => !(f.k === "password" && filaForm.value)));

async function iniciar() {
  error.value = "";
  try {
    await load(k);
    if (k === "aprendices" && !store.cursos) await load("cursos");
  } catch (e) {
    error.value = errMsg(e);
  } finally {
    cargando.value = false;
  }
}

function abrirForm(fila = null) {
  filaForm.value = fila;
  mostrarForm.value = true;
}

async function guardar(payload) {
  const nuevo = !filaForm.value;
  try {
    const { data } = nuevo ? await api.post(v.create, payload) : await api.put(v.update + filaForm.value._id, payload);
    toast(data.msg);
    await load(k);
  } catch (e) {
    fail("No se pudo guardar", errMsg(e));
    return false;
  }
}

function alternar(r) {
  const apagar = r.status === 0;
  confirmar(
    (apagar ? "Desactivar " : "Activar ") + v.noun,
    `${r.nombre}: ${apagar ? "dejará de estar disponible." : "volverá a estar disponible."}`,
    apagar ? "Desactivar" : "Activar",
    async () => {
      const { data } = await api.put(`${v.url}/${apagar ? "inactive" : "active"}/${r._id}`);
      await load(k);
      return data.msg;
    },
    apagar
  );
}

onMounted(async () => {
  const abrirNuevo = !!route.query.nuevo;
  if (route.query.q || route.query.nuevo) router.replace({ name: k });
  await iniciar();
  if (abrirNuevo) abrirForm();
});
</script>

<template>
  <div v-if="cargando" class="panel skel"></div>

  <div v-else-if="error && !todos.length" class="panel empty">
    <strong>No pudimos cargar {{ v.title.toLowerCase() }}</strong>{{ error }}
  </div>

  <template v-else>
    <div class="tools">
      <label class="search">
        <Icon name="search" />
        <input v-model="q" type="text" :placeholder="`Buscar ${v.title.toLowerCase()}…`" aria-label="Buscar">
      </label>
      <button class="btn primary" type="button" @click="abrirForm()">Nuevo {{ v.noun }}</button>
    </div>

    <div class="panel">
      <div v-if="filas.length" class="scroll">
        <table>
          <thead>
            <tr><th v-for="c in v.cols" :key="c.l">{{ c.l }}</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="r in filas" :key="r._id">
              <td v-for="c in v.cols" :key="c.l">
                <span v-if="c.badge" class="badge" :class="r.status === 0 ? 'on' : 'off'">{{ r.status === 0 ? "Activo" : "Inactivo" }}</span>
                <template v-else>{{ c.v(r) }}</template>
              </td>
              <td>
                <div class="acts">
                  <button v-if="v.edit" class="btn soft" type="button" @click="abrirForm(r)">Editar</button>
                  <button class="btn" :class="r.status === 0 ? 'soft' : 'primary'" type="button" @click="alternar(r)">
                    {{ r.status === 0 ? "Desactivar" : "Activar" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">
        <template v-if="todos.length">
          <strong>Sin resultados</strong>Prueba con otra búsqueda.
        </template>
        <template v-else>
          <strong>Aún no hay {{ v.title.toLowerCase() }}</strong>Crea el primer {{ v.noun }} con el botón “Nuevo {{ v.noun }}”.
        </template>
      </div>
    </div>
  </template>

  <FormModal v-if="mostrarForm" :title="(filaForm ? 'Editar ' : 'Nuevo ') + v.noun" :ok="filaForm ? 'Guardar cambios' : 'Crear'"
             :fields="camposForm" :row="filaForm" :cursos="store.cursos || []" :submit="guardar" @close="mostrarForm = false" />
</template>
