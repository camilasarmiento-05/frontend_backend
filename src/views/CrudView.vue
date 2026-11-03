<script setup>
// Listado genérico (usuarios, aprendices, cursos): búsqueda, crear, editar y activar/desactivar (con iconos).
// Los aprendices (v.paginado) se piden al backend de 10 en 10 con paginación y búsqueda en el servidor.
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";
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

const LIMITE = 10;                       // registros por página (solo vistas paginadas)
const paginado = !!v.paginado;
const q = ref(String(route.query.q || ""));
const cargando = ref(paginado ? true : !store[k]);
const cambiando = ref(false);            // cargando otra página (la tabla se atenúa, no parpadea)
const error = ref("");
const mostrarForm = ref(false);
const filaForm = ref(null); // null = nuevo registro

// Estado de la paginación (solo se usa cuando v.paginado)
const pagina = ref(1);
const docs = ref([]);
const info = reactive({ total: 0, pages: 1 });
let peticion = 0;                        // evita que una respuesta lenta pise a una más reciente

const todos = computed(() => (paginado ? docs.value : store[k] || []));
const filas = computed(() => {
  if (paginado) return docs.value;
  const term = q.value.toLowerCase();
  return todos.value.filter((r) =>
    !term || JSON.stringify(Object.values(r)).toLowerCase().includes(term) || (r.curso?.nombre || "").toLowerCase().includes(term));
});
const hayBusqueda = computed(() => !!q.value.trim());
const sinResultados = computed(() => (paginado ? hayBusqueda.value : todos.value.length > 0));
const camposForm = computed(() => v.fields.filter((f) => !(f.k === "password" && filaForm.value)));

// Rango que se muestra ("Mostrando 11–20 de 37") y números de página visibles (con "…").
const desde = computed(() => (info.total ? (pagina.value - 1) * LIMITE + 1 : 0));
const hasta = computed(() => Math.min(pagina.value * LIMITE, info.total));
const paginas = computed(() => {
  const n = info.pages, p = pagina.value;
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
  const set = new Set([1, n, p - 1, p, p + 1]);
  if (p <= 3) [2, 3, 4].forEach((x) => set.add(x));
  if (p >= n - 2) [n - 3, n - 2, n - 1].forEach((x) => set.add(x));
  const lista = [...set].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b);
  return lista.flatMap((x, i) => (i && x - lista[i - 1] > 1 ? ["…", x] : [x]));
});

async function cargarPagina() {
  const mia = ++peticion;
  const { data } = await api.get(v.url, { params: { page: pagina.value, limit: LIMITE, q: q.value.trim() || undefined } });
  if (mia !== peticion) return;
  docs.value = data.docs;
  info.total = data.total;
  info.pages = data.pages;
  pagina.value = data.page;
}

async function irA(n) {
  if (typeof n !== "number" || n < 1 || n > info.pages || n === pagina.value || cambiando.value) return;
  pagina.value = n;
  cambiando.value = true;
  try {
    await cargarPagina();
  } catch (e) {
    fail("No se pudo cargar la página", errMsg(e));
  } finally {
    cambiando.value = false;
  }
}

// Búsqueda en el servidor: espera a que dejes de escribir y vuelve a la página 1.
let espera;
watch(q, () => {
  if (!paginado) return;
  clearTimeout(espera);
  espera = setTimeout(async () => {
    pagina.value = 1;
    cambiando.value = true;
    try {
      await cargarPagina();
    } catch (e) {
      fail("No se pudo buscar", errMsg(e));
    } finally {
      cambiando.value = false;
    }
  }, 350);
});
onBeforeUnmount(() => clearTimeout(espera));

// Vuelve a pedir los datos (la página actual y, para los contadores del menú/inicio, la lista completa).
async function refrescar() {
  if (paginado) await Promise.all([cargarPagina(), load(k)]);
  else await load(k);
}

async function iniciar() {
  error.value = "";
  try {
    if (paginado) {
      await cargarPagina();
      load(k).catch(() => {}); // contadores del menú, sin bloquear la pantalla
    } else {
      await load(k);
    }
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
    await refrescar();
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
      await refrescar();
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
      <div v-if="filas.length" class="scroll" :class="{ cambiando }">
        <table>
          <thead>
            <tr><th v-for="c in v.cols" :key="c.l">{{ c.l }}</th><th class="th-acts">Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in filas" :key="r._id">
              <td v-for="c in v.cols" :key="c.l">
                <span v-if="c.badge" class="badge" :class="r.status === 0 ? 'on' : 'off'">{{ r.status === 0 ? "Activo" : "Inactivo" }}</span>
                <template v-else>{{ c.v(r) }}</template>
              </td>
              <td>
                <div class="acts">
                  <button v-if="v.edit" class="ibtn edit" type="button" :title="`Editar ${v.noun}`" :aria-label="`Editar ${v.noun}`" @click="abrirForm(r)">
                    <Icon name="editar" />
                  </button>
                  <button class="ibtn" :class="r.status === 0 ? 'off' : 'on'" type="button"
                          :title="`${r.status === 0 ? 'Desactivar' : 'Activar'} ${v.noun}`"
                          :aria-label="`${r.status === 0 ? 'Desactivar' : 'Activar'} ${v.noun}`" @click="alternar(r)">
                    <Icon :name="r.status === 0 ? 'desactivar' : 'activar'" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">
        <template v-if="sinResultados">
          <strong>Sin resultados</strong>Prueba con otra búsqueda.
        </template>
        <template v-else>
          <strong>Aún no hay {{ v.title.toLowerCase() }}</strong>Crea el primer {{ v.noun }} con el botón “Nuevo {{ v.noun }}”.
        </template>
      </div>

      <nav v-if="paginado && info.total" class="pager" aria-label="Paginación">
        <span class="pager-info">Mostrando {{ desde }}–{{ hasta }} de {{ info.total }}</span>
        <div class="pager-btns">
          <button class="pbtn" type="button" :disabled="pagina === 1 || cambiando" aria-label="Página anterior" title="Anterior" @click="irA(pagina - 1)">
            <Icon name="atras" />
          </button>
          <template v-for="(n, i) in paginas" :key="i">
            <span v-if="n === '…'" class="pager-gap">…</span>
            <button v-else class="pbtn" :class="{ cur: n === pagina }" type="button" :disabled="cambiando"
                    :aria-current="n === pagina ? 'page' : undefined" :aria-label="`Página ${n}`" @click="irA(n)">{{ n }}</button>
          </template>
          <button class="pbtn" type="button" :disabled="pagina === info.pages || cambiando" aria-label="Página siguiente" title="Siguiente" @click="irA(pagina + 1)">
            <Icon name="siguiente" />
          </button>
        </div>
      </nav>
    </div>
  </template>

  <FormModal v-if="mostrarForm" :title="(filaForm ? 'Editar ' : 'Nuevo ') + v.noun" :ok="filaForm ? 'Guardar cambios' : 'Crear'"
             :fields="camposForm" :row="filaForm" :cursos="store.cursos || []" :submit="guardar" @close="mostrarForm = false" />
</template>
