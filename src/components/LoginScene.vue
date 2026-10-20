<script setup>
// Fondo del login: video de paisaje (si existe) y, como respaldo, un paisaje animado en canvas.
import { ref, onMounted, onBeforeUnmount } from "vue";

const cv = ref(null);
const vid = ref(null);
const playing = ref(false);
let raf = 0, run = true;

onMounted(() => {
  const g = cv.value.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, t = 0;
  const fit = () => { W = cv.value.width = innerWidth; H = cv.value.height = innerHeight; };
  addEventListener("resize", fit); fit();
  const layers = [
    { y: .50, a: .10, s: 6,  c: "#2f7d3a", f: [.0035, .009, .021] },
    { y: .60, a: .09, s: 12, c: "#1f6a2c", f: [.0042, .011, .027] },
    { y: .72, a: .08, s: 22, c: "#124c1f", f: [.005, .013, .031], trees: 1 },
    { y: .88, a: .06, s: 40, c: "#072a10", f: [.006, .016, .038], trees: 2 }
  ];
  const ridge = (L, x) => H * (L.y - L.a * (Math.sin(x * L.f[0] + L.y * 9) * .6 + Math.sin(x * L.f[1] + 2) * .3 + Math.sin(x * L.f[2] + 5) * .1));
  const rnd = (n) => { const v = Math.sin(n * 127.1) * 43758.5; return v - Math.floor(v); };
  const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + .6, v: Math.random() * .4 + .1 }));

  function draw() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0b3d2a"); sky.addColorStop(.45, "#5aa66a"); sky.addColorStop(.75, "#f3d77a"); sky.addColorStop(1, "#f7b955");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const sx = W * .68, sy = H * .48, sun = g.createRadialGradient(sx, sy, 0, sx, sy, H * .6);
    sun.addColorStop(0, "rgba(255,244,190,.95)"); sun.addColorStop(.12, "rgba(255,226,140,.6)"); sun.addColorStop(1, "rgba(255,200,100,0)");
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { // nubes que derivan
      const cx = ((i * .27 + t * .00003 * (1 + i * .3)) % 1.3 - .15) * W, cy = H * (.1 + i * .06);
      const c = g.createRadialGradient(cx, cy, 0, cx, cy, W * .14);
      c.addColorStop(0, "rgba(255,255,255,.3)"); c.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = c; g.fillRect(cx - W * .14, cy - W * .14, W * .28, W * .28);
    }
    layers.forEach((L, li) => {
      const off = t * L.s * .02;
      g.fillStyle = L.c; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, ridge(L, x + off));
      g.lineTo(W, H); g.fill();
      if (L.trees) {
        const gap = L.trees === 1 ? 26 : 44, sz = L.trees === 1 ? 34 : 70;
        for (let i = Math.floor(off / gap) - 1; i < (off + W) / gap + 2; i++) {
          const wx = i * gap + rnd(i + li) * gap * .7, x = wx - off, y = ridge(L, wx), h = sz * (.7 + rnd(i * 3 + li) * .6);
          g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + h * .22, y - h * .45); g.lineTo(x + h * .12, y - h * .45);
          g.lineTo(x + h * .3, y - h * .05); g.lineTo(x - h * .3, y - h * .05); g.lineTo(x - h * .12, y - h * .45); g.lineTo(x - h * .22, y - h * .45); g.fill();
        }
      }
      const m = g.createLinearGradient(0, H * (L.y - .12), 0, H * (L.y + .05));
      m.addColorStop(0, "rgba(220,240,210,0)"); m.addColorStop(1, "rgba(220,240,210," + (.16 - li * .03) + ")");
      g.fillStyle = m; g.fillRect(0, H * (L.y - .12), W, H * .17);
    });
    g.fillStyle = "rgba(255,255,255,.55)";
    parts.forEach((p) => { p.y += p.v * .013; p.x += .0013 * .1; if (p.y > 1) p.y = 0; if (p.x > 1) p.x = 0; g.beginPath(); g.arc(p.x * W, p.y * H, p.r, 0, 6.3); g.fill(); });
  }
  const loop = () => { if (!run) return; t += 16; draw(); if (!still) raf = requestAnimationFrame(loop); };
  loop();
  cv.value._fit = fit;
});

onBeforeUnmount(() => {
  run = false;
  cancelAnimationFrame(raf);
  if (cv.value?._fit) removeEventListener("resize", cv.value._fit);
  vid.value?.pause();
});
</script>

<template>
  <canvas id="scene" ref="cv" aria-hidden="true"></canvas>
  <video id="bgvideo" ref="vid" :src="videoSrc" :class="{ on: playing }" autoplay muted loop playsinline aria-hidden="true" @playing="playing = true">
  </video>
  <div class="veil"></div>
</template>
