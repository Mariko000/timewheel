 <!-- ActivityInput.vue 用（感情）＊ReactiveAvatar.vueからここに分岐-->
<template>
    <div class="avatar-wrapper">
      <img :src="currentFrame" alt="Avatar" class="avatar-img" />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from "vue"
  
  const currentFrame = ref(new URL("./OpeningMotions/motion1.png", import.meta.url).href)
  let frameIndex = 1
  let interval = null
  
  onMounted(() => {
    interval = setInterval(() => {
      frameIndex = (frameIndex % 5) + 1
      currentFrame.value = new URL(`./OpeningMotions/motion${frameIndex}.png`, import.meta.url).href
    }, 10000) // 切り替え間隔時間
  })
  
  onUnmounted(() => clearInterval(interval))
  </script>
  
  <style scoped>
  .avatar-wrapper {
    width: 180px;
    height: 180px;
  }
  
  .avatar-img {
    width: 100%;
    height: auto;
    image-rendering: crisp-edges;
    animation: subtleFloat 3s ease-in-out infinite;
  }
  
  @keyframes subtleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  </style>
  