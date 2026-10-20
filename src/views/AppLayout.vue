<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "@/components/Icon.vue";
import { auth, clearSession } from "@/stores/auth";
import { store, loadAll, resetStore } from "@/stores/data";
import { confirmar } from "@/services/alerts";
import { HOME, VIEWS } from "@/config/views";

const route = useRoute();
const router = useRouter();

const items = [HOME, ...Object.values(VIEWS)];
const actual = computed(() => route.meta.key || "inicio");
const min = ref(!!localStorage.getItem("min"));   // menú contraído
const abierto = ref(false);                         // menú abierto en móvil
const nav = ref(null);
const pillY = ref(0);

const nombre = computed(() => auth.user?.nombre || "Usuario");
const rol = computed(() => (auth.user?.rol === "ADMIN" ? "Administrador" : "Usuario"));
const inicial = computed(() => nombre.value.trim().charAt(0).toUpperCase());
const cuenta = (k) => (store[k] ? store[k].length : "–");

async function movePill() {
  await nextTick();
  const a = nav.value?.querySelector(".nav-item.active");
  if (a) pillY.value = a.offsetTop;
}
function ir(it) {
  abierto.value = false;
  router.push({ name: it.key });
}
function contraer() {
  min.value = !min.value;
  localStorage.setItem("min", min.value ? "1" : "");
  setTimeout(movePill, 320);
}
function salir() {
  confirmar("Cerrar sesión", "¿Quieres salir de la plataforma?", "Cerrar sesión", () => {
    clearSession();
    resetStore();
    router.replace({ name: "login" });
  });
}

watch(actual, movePill);
onMounted(() => {
  window.addEventListener("resize", movePill);
  loadAll().then(movePill);
  movePill();
});
onBeforeUnmount(() => window.removeEventListener("resize", movePill));
</script>

<template>
  <div class="app" :class="{ min, open: abierto }">
    <aside class="sidebar" aria-label="Menú principal">
      <div class="brand">
        <img src="/assets/img/logo-sena.png" alt="SENA">
        <div class="brand-text"><strong>SENA</strong><span>Gestión académica</span></div>
      </div>

      <nav class="nav" ref="nav">
        <span class="pill" :style="{ transform: `translateY(${pillY}px)` }"></span>
        <button v-for="it in items" :key="it.key" type="button" class="nav-item"
                :class="{ active: actual === it.key }" :data-tip="it.title" @click="ir(it)">
          <Icon :name="it.key" />
          <span class="label">{{ it.title }}</span>
          <span v-if="it.key !== 'inicio'" class="count">{{ cuenta(it.key) }}</span>
        </button>
      </nav>

      <div class="side-foot">
        <div class="me">
          <span class="avatar">{{ inicial }}</span>
          <div class="me-text"><strong>{{ nombre }}</strong><span>{{ rol }}</span></div>
        </div>
        <button class="nav-item logout" type="button" data-tip="Cerrar sesión" @click="salir">
          <Icon name="salir" />
          <span class="label">Cerrar sesión</span>
        </button>
        <button class="collapse" type="button" aria-label="Contraer menú" @click="contraer">
          <Icon name="atras" />
        </button>
      </div>
    </aside>
    <div class="scrim" @click="abierto = false"></div>

    <div class="main">
      <header class="topbar">
        <button class="ghost dark burger" type="button" aria-label="Abrir menú" @click="abierto = true">
          <Icon name="menu" />
        </button>
        <div><h1>{{ route.meta.title }}</h1><p>{{ route.meta.sub }}</p></div>
      </header>
      <section class="content" tabindex="-1">
        <router-view v-slot="{ Component, route: r }">
          <component :is="Component" :key="r.name" />
        </router-view>
      </section>
    </div>
  </div>
</template>
