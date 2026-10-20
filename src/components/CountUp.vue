<script setup>
// Número que sube animado desde 0 hasta "value".
import { ref, onMounted, onBeforeUnmount } from "vue";
import { fmt } from "@/utils/format";

const props = defineProps({ value: { type: Number, default: 0 }, decimals: { type: Number, default: 0 } });
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const texto = ref(fmt(0, props.decimals));
let raf = 0;

onMounted(() => {
  if (quieto) { texto.value = fmt(props.value, props.decimals); return; }
  const dur = 1400, t0 = performance.now() + 250;
  const paso = (t) => {
    const p = Math.min(Math.max((t - t0) / dur, 0), 1), e = 1 - Math.pow(1 - p, 3);
    texto.value = fmt(props.value * e, props.decimals);
    if (p < 1) raf = requestAnimationFrame(paso);
  };
  raf = requestAnimationFrame(paso);
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>{{ texto }}</template>
