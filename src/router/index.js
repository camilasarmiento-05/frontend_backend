import { createRouter, createWebHashHistory } from "vue-router";
import { isLogged } from "@/stores/auth";
import { HOME, VIEWS } from "@/config/views";

const meta = (v) => ({ key: v.key, title: v.title, sub: v.sub });

const routes = [
  { path: "/login", name: "login", component: () => import("@/views/LoginView.vue"), meta: { guest: true } },
  {
    path: "/",
    component: () => import("@/views/AppLayout.vue"),
    meta: { auth: true },
    children: [
      { path: "", name: "inicio", component: () => import("@/views/HomeView.vue"), meta: meta(HOME) },
      ...Object.values(VIEWS).map((v) => ({
        path: v.key, name: v.key, component: () => import("@/views/CrudView.vue"), meta: meta(v)
      }))
    ]
  },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

// Modo hash (#/usuarios): funciona igual en Vite y cuando el backend sirve el build.
const router = createRouter({ history: createWebHashHistory(), routes });

router.beforeEach((to) => {
  if (to.meta.auth && !isLogged()) return { name: "login" };
  if (to.meta.guest && isLogged()) return { name: "inicio" };
});

export default router;
