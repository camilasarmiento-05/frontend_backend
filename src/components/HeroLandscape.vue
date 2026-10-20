<script setup>
// Paisaje del Inicio: cambia según la hora real (alba, día, ocaso, noche) y reacciona al mouse.
import { ref, onMounted, onBeforeUnmount } from "vue";

const cv = ref(null);
let raf = 0, stopped = false, ro = null, hero = null, onMove = null, onLeave = null;

const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
const rgb = (c) => `rgb(${c})`;
const NOCHE = [hex("#050f1f"), hex("#0b2a3a"), hex("#14463a")];
const ALBA = [hex("#27406b"), hex("#e58f6a"), hex("#f7d58a")];
const DIA = [hex("#2c7bb5"), hex("#7fc4e6"), hex("#dff3cf")];
const OCASO = [hex("#3b3f7a"), hex("#e8805a"), hex("#f9c866")];
// [hora, colores del cielo, oscuridad que se aplica a las montañas]
const KEYS = [[0, NOCHE, .6], [5, NOCHE, .6], [6.5, ALBA, .15], [9, DIA, 0], [16, DIA, 0], [17.8, OCASO, .12], [19.6, NOCHE, .55], [24, NOCHE, .6]];
function cielo(h) {
  let i = 1; while (KEYS[i][0] < h) i++;
  const [h0, c0, d0] = KEYS[i - 1], [h1, c1, d1] = KEYS[i], u = (h - h0) / (h1 - h0);
  return { c: c0.map((c, j) => mix(c, c1[j], u)), dark: d0 + (d1 - d0) * u };
}
const rnd = (n) => { const v = Math.sin(n * 127.1) * 43758.5; return v - Math.floor(v); };

onMounted(() => {
  const el = cv.value, g = el.getContext("2d");
  hero = el.parentElement;
  let W = 0, H = 0, t = 0, tx = 0, px = 0;
  const fit = () => {
    const r = el.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; el.width = W * d; el.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
  };
  ro = new ResizeObserver(fit); ro.observe(el); fit();
  onMove = (e) => { const r = hero.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; };
  onLeave = () => { tx = 0; };
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", onLeave);

  const capas = [
    { y: .60, a: .10, s: 5,  c: "#2f7d3a", f: [.0035, .009, .021], par: 24 },
    { y: .70, a: .09, s: 10, c: "#1f6a2c", f: [.0042, .011, .027], par: 48 },
    { y: .82, a: .08, s: 18, c: "#124c1f", f: [.005, .013, .031], par: 84, arb: 1 },
    { y: .98, a: .06, s: 32, c: "#072a10", f: [.006, .016, .038], par: 130, arb: 2 }
  ];
  const cresta = (L, x) => H * (L.y - L.a * (Math.sin(x * L.f[0] + L.y * 9) * .6 + Math.sin(x * L.f[1] + 2) * .3 + Math.sin(x * L.f[2] + 5) * .1));
  const estrellas = Array.from({ length: 70 }, (_, i) => ({ x: rnd(i + 1), y: rnd(i + 90) * .5, r: rnd(i + 9) * 1.3 + .4, f: rnd(i + 3) * 6 }));
  const motas = Array.from({ length: 36 }, (_, i) => ({ x: rnd(i + 200), y: .45 + rnd(i + 300) * .5, r: rnd(i + 5) * 2 + .8, v: rnd(i + 7) * .5 + .15, f: rnd(i + 11) * 6 }));

  function dibujar() {
    if (W < 2) return;
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    const { c, dark } = cielo(h), noche = Math.min(Math.max((dark - .15) / .4, 0), 1);
    const sk = g.createLinearGradient(0, 0, 0, H);
    sk.addColorStop(0, rgb(c[0])); sk.addColorStop(.55, rgb(c[1])); sk.addColorStop(1, rgb(c[2]));
    g.fillStyle = sk; g.fillRect(0, 0, W, H);

    if (noche > 0) { // estrellas que titilan
      estrellas.forEach((s) => {
        g.fillStyle = `rgba(255,255,255,${noche * (.45 + .5 * Math.sin(t * .003 + s.f))})`;
        g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.3); g.fill();
      });
    }

    // sol de 6:00 a 18:00 y luna el resto; recorren un arco por el cielo
    const dia = h >= 6 && h < 18, p = dia ? (h - 6) / 12 : (h >= 18 ? h - 18 : h + 6) / 12;
    const ox = W * (.1 + .8 * p), oy = H * (.66 - .52 * Math.sin(Math.PI * p)), rad = dia ? H * .6 : H * .35;
    const halo = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
    halo.addColorStop(0, dia ? "rgba(255,244,190,.95)" : "rgba(220,235,255,.55)");
    halo.addColorStop(.14, dia ? "rgba(255,226,140,.5)" : "rgba(200,220,255,.18)");
    halo.addColorStop(1, "rgba(255,220,140,0)");
    g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.fillStyle = dia ? "#fff6c9" : "#eef4ff"; g.beginPath(); g.arc(ox, oy, dia ? H * .045 : H * .035, 0, 6.3); g.fill();

    for (let i = 0; i < 4; i++) { // nubes
      const cx = ((i * .31 + t * .000022 * (1 + i * .3)) % 1.4 - .2) * W, cy = H * (.12 + i * .075), cr = W * .12;
      const n = g.createRadialGradient(cx, cy, 0, cx, cy, cr);
      n.addColorStop(0, `rgba(255,255,255,${.32 * (1 - noche * .8)})`); n.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = n; g.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
    }

    px += (tx - px) * .05;
    capas.forEach((L) => {
      const off = t * L.s * .02 - px * L.par;
      g.fillStyle = L.c; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, cresta(L, x + off));
      g.lineTo(W, H); g.fill();
      if (L.arb) {
        const sep = L.arb === 1 ? 24 : 42, tam = L.arb === 1 ? H * .11 : H * .22;
        for (let i = Math.floor(off / sep) - 1; i < (off + W) / sep + 2; i++) {
          const wx = i * sep + rnd(i + L.arb) * sep * .7, x = wx - off, y = cresta(L, wx), a = tam * (.7 + rnd(i * 3 + L.arb) * .6);
          g.beginPath(); g.moveTo(x, y - a); g.lineTo(x + a * .22, y - a * .45); g.lineTo(x + a * .12, y - a * .45);
          g.lineTo(x + a * .3, y - a * .05); g.lineTo(x - a * .3, y - a * .05); g.lineTo(x - a * .12, y - a * .45); g.lineTo(x - a * .22, y - a * .45); g.fill();
        }
      }
    });
    if (dark > 0) { g.fillStyle = `rgba(3,12,24,${dark * .75})`; g.fillRect(0, 0, W, H); }

    // de día, polen que sube; de noche, luciérnagas que parpadean
    motas.forEach((m) => {
      m.y -= m.v * .00035 * 16; m.x += .00006 * 16 * (1 + Math.sin(t * .001 + m.f));
      if (m.y < .3) m.y = 1;
      if (m.x > 1) m.x = 0;
      const a = noche > .3 ? .35 + .65 * Math.max(0, Math.sin(t * .003 + m.f)) : .4;
      g.fillStyle = noche > .3 ? `rgba(220,255,120,${a})` : `rgba(255,255,255,${a})`;
      g.shadowColor = noche > .3 ? "rgba(220,255,120,.9)" : "transparent"; g.shadowBlur = noche > .3 ? 10 : 0;
      g.beginPath(); g.arc(m.x * W, m.y * H, m.r, 0, 6.3); g.fill();
    });
    g.shadowBlur = 0;
  }
  const loop = () => { if (stopped) return; t += 16; dibujar(); if (!quieto) raf = requestAnimationFrame(loop); };
  loop();
});

onBeforeUnmount(() => {
  stopped = true;
  cancelAnimationFrame(raf);
  ro?.disconnect();
  hero?.removeEventListener("pointermove", onMove);
  hero?.removeEventListener("pointerleave", onLeave);
});
</script>

<template>
  <canvas class="hh-scene" ref="cv" aria-hidden="true"></canvas>
</template>
