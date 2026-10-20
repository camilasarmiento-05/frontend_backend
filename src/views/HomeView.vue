<script setup>
// Inicio: saludo con paisaje según la hora, indicadores con anillos, aprendices por curso y últimos registros.
// Los datos salen de GET /cursos y GET /aprendices.
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import CountUp from "@/components/CountUp.vue";
import HeroLandscape from "@/components/HeroLandscape.vue";
import { ICONS } from "@/config/icons";
import { auth } from "@/stores/auth";
import { store, load } from "@/stores/data";
import { S } from "@/services/alerts";
import { esc, errMsg, fmt, titulo, iniciales, hace, cap } from "@/utils/format";

const router = useRouter();
const cargando = ref(true);
const error = ref("");
const go = ref(false);

onMounted(async () => {
  try {
    await Promise.all([load("cursos"), load("aprendices")]);
  } catch (e) {
    error.value = errMsg(e);
    S.fire({ icon: "error", title: "No pudimos cargar el resumen", text: error.value });
  } finally {
    cargando.value = false;
  }
  await nextTick();
  requestAnimationFrame(() => requestAnimationFrame(() => { go.value = true; }));
});

/* ---------- Cálculos ---------- */
const cursos = computed(() => store.cursos || []);
const aprendices = computed(() => store.aprendices || []);
const cAct = computed(() => cursos.value.filter((c) => c.status === 0));
const aAct = computed(() => aprendices.value.filter((a) => a.status === 0));
const mapa = computed(() => {
  const m = new Map(cAct.value.map((c) => [c._id, { c, n: 0 }]));
  aAct.value.forEach((a) => { const e = m.get(a.curso?._id); if (e) e.n++; });
  return m;
});
const ranking = computed(() => [...mapa.value.values()].sort((a, b) => b.n - a.n).slice(0, 6));
const maxN = computed(() => ranking.value[0]?.n || 1);
const suma = (l) => l.reduce((s, c) => s + (Number(c.duracion) || 0), 0);
const horasAct = computed(() => suma(cAct.value));
const horasTot = computed(() => suma(cursos.value));
const prom = computed(() => (cAct.value.length ? aAct.value.length / cAct.value.length : 0));
const ultimos = computed(() => aprendices.value.slice(0, 6));
const ratio = (a, b) => (b ? Math.min(a / b, 1) : 0);

const ahora = new Date();
const hora = ahora.getHours();
const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
const nombre = computed(() => titulo((auth.user?.nombre || "Usuario").split(/\s+/)[0]));
const fecha = cap(ahora.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));
const horaTxt = ahora.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
const palabras = computed(() => `${saludo}, ${nombre.value}.`.split(" "));

const KPIS = computed(() => [
  { id: "cursos", i: ICONS.cursos, v: cAct.value.length, de: cursos.value.length, d: 0, l: "Cursos activos", r: ratio(cAct.value.length, cursos.value.length), c: "#39a900" },
  { id: "aprendices", i: ICONS.aprendices, v: aAct.value.length, de: aprendices.value.length, d: 0, l: "Aprendices activos", r: ratio(aAct.value.length, aprendices.value.length), c: "#e0a010" },
  { id: "horas", i: ICONS.horas, v: horasAct.value, de: 0, d: 0, l: "Horas de formación", r: ratio(horasAct.value, horasTot.value), c: "#1d8f8a" },
  { id: "promedio", i: ICONS.promedio, v: prom.value, de: 0, d: 1, l: "Aprendices por curso", r: ratio(prom.value, maxN.value), c: "#5c9f10" }
]);

/* ---------- Interacciones (SweetAlert2) ---------- */
const pregunta = (o, onOk) =>
  S.fire({ showCancelButton: true, cancelButtonText: "Cerrar", reverseButtons: true, ...o }).then((x) => x.isConfirmed && onOk && onOk());
const filas = (l) => `<dl class="swal-kv">${l.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;

const ir = (name) => router.push({ name });
const nuevoAprendiz = () => router.push({ name: "aprendices", query: { nuevo: 1 } });
const verAprendices = (texto) => router.push({ name: "aprendices", query: { q: texto } });

function infoKpi(id) {
  if (id === "cursos")
    pregunta({ icon: "info", title: "Cursos activos", html: `Tienes <b>${fmt(cAct.value.length)}</b> cursos activos de <b>${fmt(cursos.value.length)}</b> registrados.`, confirmButtonText: "Ver cursos" }, () => ir("cursos"));
  else if (id === "aprendices")
    pregunta({ icon: "info", title: "Aprendices activos", html: `Hay <b>${fmt(aAct.value.length)}</b> aprendices activos de <b>${fmt(aprendices.value.length)}</b> registrados.`, confirmButtonText: "Ver aprendices" }, () => ir("aprendices"));
  else if (id === "horas")
    S.fire({ icon: "info", title: "Horas de formación", html: `Es la suma de la duración de tus <b>${fmt(cAct.value.length)}</b> cursos activos: <b>${fmt(horasAct.value)}</b> horas de un total de <b>${fmt(horasTot.value)}</b> horas registradas.` });
  else
    S.fire({ icon: "info", title: "Aprendices por curso", html: `Resulta de repartir <b>${fmt(aAct.value.length)}</b> aprendices activos entre <b>${fmt(cAct.value.length)}</b> cursos activos: en promedio <b>${fmt(prom.value, 1)}</b> por curso.` });
}
function infoCurso(x) {
  pregunta({
    title: titulo(x.c.nombre),
    html: filas([["Código", esc(x.c.codigo)], ["Duración", `${fmt(x.c.duracion)} horas`], ["Aprendices activos", String(x.n)], ["Del total", `${aAct.value.length ? Math.round((x.n / aAct.value.length) * 100) : 0} %`]]),
    confirmButtonText: "Ver aprendices"
  }, () => verAprendices(x.c.nombre));
}
function infoAprendiz(a) {
  pregunta({
    title: titulo(a.nombre),
    html: filas([["Documento", esc(a.documento)], ["Correo", esc(a.email)], ["Curso", esc(titulo(a.curso?.nombre || "Sin curso"))], ["Estado", a.status === 0 ? "Activo" : "Inactivo"]]),
    confirmButtonText: "Ver en aprendices"
  }, () => verAprendices(a.nombre));
}
</script>

<template>
  <div v-if="cargando" class="home"><div class="panel skel hh-skel"></div></div>

  <div v-else-if="error" class="panel empty">
    <strong>No pudimos cargar el resumen</strong>{{ error }}
  </div>

  <div v-else class="home" :class="{ go }">
    <section class="hh rise" aria-label="Resumen del día">
      <HeroLandscape />
      <div class="hh-veil"></div>
      <span class="hh-live"><i></i>Actualizado a las {{ horaTxt }}</span>
      <div class="hh-body">
        <p class="hh-date">{{ fecha }}</p>
        <h2><template v-for="(w, i) in palabras" :key="i"><span class="w" :style="{ '--w': i }">{{ w }}</span>{{ " " }}</template></h2>
        <p class="sub">Este es el pulso de tu centro: cuántos cursos están en marcha y cómo se reparten tus aprendices.</p>
        <div class="hh-actions">
          <button type="button" class="btn sun" @click="nuevoAprendiz"><Icon name="plus" />Nuevo aprendiz</button>
          <button type="button" class="btn glass" @click="ir('cursos')">Ver cursos<Icon name="flecha" /></button>
        </div>
      </div>
    </section>

    <section class="kpis rise" style="--i:1" aria-label="Indicadores">
      <button v-for="(k, i) in KPIS" :key="k.id" type="button" class="kpi"
              :style="{ '--c': k.c, '--r': k.r.toFixed(3), '--d': (0.3 + i * 0.12).toFixed(2) + 's' }" @click="infoKpi(k.id)">
        <div class="kpi-top">
          <div class="ring">
            <svg class="rg" viewBox="0 0 44 44"><circle class="trk" cx="22" cy="22" r="18"/><circle class="val" cx="22" cy="22" r="18"/></svg>
            <svg class="ic" viewBox="0 0 24 24" v-html="k.i"></svg>
          </div>
          <span v-if="k.de" class="de">de {{ fmt(k.de) }}</span>
        </div>
        <div class="num"><CountUp :value="k.v" :decimals="k.d" /></div>
        <div class="lbl">{{ k.l }}</div>
      </button>
    </section>

    <div class="cols">
      <section class="panel rise" style="--i:2">
        <div class="card-h"><h3>Aprendices por curso</h3><small>Solo activos</small></div>
        <ul v-if="ranking.length" class="bars">
          <li v-for="(x, i) in ranking" :key="x.c._id">
            <button type="button" class="bar" :style="{ '--p': (x.n / maxN * 100).toFixed(1) + '%', '--i': i }" @click="infoCurso(x)">
              <span class="nm" :title="titulo(x.c.nombre)">{{ titulo(x.c.nombre) }}</span>
              <span class="tr"><span class="fl"></span></span>
              <span class="n">{{ x.n }}</span>
            </button>
          </li>
        </ul>
        <div v-else class="empty"><strong>Aún no hay cursos activos</strong>Crea un curso para ver aquí cómo se reparten tus aprendices.</div>
      </section>

      <section class="panel rise" style="--i:3">
        <div class="card-h"><h3>Últimos registros</h3><button type="button" class="link" @click="ir('aprendices')">Ver todos</button></div>
        <ul v-if="ultimos.length" class="regs">
          <li v-for="(a, i) in ultimos" :key="a._id">
            <button type="button" class="reg" :style="{ '--i': i }" @click="infoAprendiz(a)">
              <span class="av">{{ iniciales(a.nombre) }}</span>
              <span class="tx"><strong>{{ titulo(a.nombre) }}</strong><span>{{ titulo(a.curso?.nombre || "Sin curso") }}</span></span>
              <time>{{ hace(a.createdAt) }}</time>
            </button>
          </li>
        </ul>
        <div v-else class="empty"><strong>Sin registros todavía</strong>Los aprendices nuevos aparecerán aquí.</div>
      </section>
    </div>
  </div>
</template>
