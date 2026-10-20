<script setup>
import { ICONS } from "@/config/icons";
defineProps({ name: { type: String, required: true } });
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[name]"></svg>
</template>
