<template>
    <div class="avatar-base">
      <img
        :src="avatarSrc"
        :alt="`Avatar: ${mood}`"
        class="avatar-image"
      />
    </div>
  </template>
  
  <script setup>
  import { computed } from "vue";
  
  // props: 表情の種類（Normal, happy, sad, thinking）
  const props = defineProps({
    mood: {
      type: String,
      default: "normal",
    },
  });
  //mood が受け取れているかを直接確認
  console.log("AvatarBase received mood:", props.mood);
  
  // 画像の動的読み込み
  const avatarSrc = computed(() => {
    switch (props.mood) {
      case "happy":
        return new URL("@/assets/avatar/happy.png", import.meta.url).href;
      case "sad":
        return new URL("@/assets/avatar/sad.png", import.meta.url).href;
      case "thinking":
        return new URL("@/assets/avatar/thinking.png", import.meta.url).href;
      case "surprise":
        return new URL("@/assets/avatar/surprise.png", import.meta.url).href;
      case "wink":
        return new URL("@/assets/avatar/wink.png", import.meta.url).href;
      default:
        return new URL("@/assets/avatar/normal3.png", import.meta.url).href;
    }
  });
  </script>
  
  <style scoped>
  .avatar-base {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .avatar-image {
    width: 120px;
    height: auto;
    object-fit: contain;
  }
  </style>
  