<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { setSession } from "@/stores/auth";
import { toast, fail, avisar } from "@/services/alerts";
import { emailOk, errMsg, titulo } from "@/utils/format";
import LoginScene from "@/components/LoginScene.vue";

const router = useRouter();
const form = reactive({ email: "", password: "" });
const bad = reactive({ email: false, password: false });
const verPass = ref(false);
const busy = ref(false);
const emailEl = ref(null);
const passEl = ref(null);

async function ingresar() {
  const email = form.email.trim(), password = form.password, errs = [];
  if (!email) errs.push("Escribe tu correo");
  else if (!emailOk(email)) errs.push("Escribe un correo válido, por ejemplo nombre@sena.edu.co");
  if (!password) errs.push("Escribe tu contraseña");
  bad.email = !email || !emailOk(email);
  bad.password = !password;
  if (errs.length) return avisar(errs, () => (bad.email ? emailEl.value : passEl.value)?.focus());

  busy.value = true;
  try {
    const { data } = await api.post("/usuarios/login", { email, password });
    setSession(data.token, data.usuario);
    await router.replace({ name: "inicio" });
    toast(`Bienvenido, ${titulo((data.usuario.nombre || "Usuario").split(" ")[0])}`);
  } catch (err) {
    fail("No pudimos iniciar sesión", errMsg(err));
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="login">
    <LoginScene />

    <section class="hero">
      <img src="/assets/img/logo-sena.png" alt="SENA" class="hero-logo">
      <h1>Bienvenido de nuevo</h1>
      <p>Administra usuarios, aprendices y cursos de la formación SENA desde un solo lugar.</p>
    </section>

    <form class="card" novalidate autocomplete="on" @submit.prevent="ingresar">
      <h2>Iniciar sesión</h2>
      <div class="field" :class="{ bad: bad.email }">
        <label for="email">Correo electrónico</label>
        <input id="email" ref="emailEl" v-model="form.email" name="email" type="text" inputmode="email"
               autocomplete="username" placeholder="usuario@sena.edu.co" @input="bad.email = false">
      </div>
      <div class="field" :class="{ bad: bad.password }">
        <label for="password">Contraseña</label>
        <div class="pass">
          <input id="password" ref="passEl" v-model="form.password" name="password" :type="verPass ? 'text' : 'password'"
                 autocomplete="current-password" placeholder="Tu contraseña" @input="bad.password = false">
          <button type="button" class="ghost" aria-label="Mostrar u ocultar contraseña" @click="verPass = !verPass">
            {{ verPass ? "Ocultar" : "Ver" }}
          </button>
        </div>
      </div>
      <button class="btn primary block" type="submit" :disabled="busy">{{ busy ? "Ingresando…" : "Ingresar" }}</button>
      <p class="legal">Acceso exclusivo para personal autorizado del SENA.</p>
    </form>
  </main>
</template>
