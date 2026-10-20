<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { clearSession } from "@/stores/auth";
import { resetStore } from "@/stores/data";
import { toast } from "@/services/alerts";

const router = useRouter();

// api.js avisa con este evento cuando el servidor responde 401 (token vencido).
function sesionVencida() {
  clearSession();
  resetStore();
  router.replace({ name: "login" });
  toast("Tu sesión venció. Ingresa de nuevo.", "bad");
}
onMounted(() => window.addEventListener("sena:unauthorized", sesionVencida));
onBeforeUnmount(() => window.removeEventListener("sena:unauthorized", sesionVencida));
</script>

<template>
  <router-view />
</template>
