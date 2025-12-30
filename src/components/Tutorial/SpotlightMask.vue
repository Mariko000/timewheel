<template>
    <div class="overlay-dark" :style="maskStyle"></div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  const props = defineProps({
    rect: { type: Object, required: true }
  })
  
  // mask を計算
  const maskStyle = computed(() => {
    const r = props.rect
    if (!r) return { background: 'rgba(0,0,0,0.1)' }
  
    return {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.1)', // 薄いオーバーレイ
      WebkitMask: `radial-gradient(circle ${r.width/2}px at ${r.left + r.width/2}px ${r.top + r.height/2}px, transparent 0%, transparent 80%, black 81%)`,
      mask: `radial-gradient(circle ${r.width/2}px at ${r.left + r.width/2}px ${r.top + r.height/2}px, transparent 0%, transparent 80%, black 81%)`,
    }
  })
  </script>
  
  <style scoped>
  .overlay-dark {
    position: absolute;
    inset: 0;
  }
  </style>
  