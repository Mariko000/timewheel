<template>
    <div class="praise-wrapper">
      
      <!-- 🎉 パーフェクト専用コメント -->
      <h2 class="praise-message">パーフェクトおめでとう！</h2>
  
      <!-- 🎉 アバター（バウンス制御用の wrapper） -->
      <div class="avatar-bounce-root" ref="avatarRoot">
        <ReactiveAvatar mood="happy" message="すごいよ！" />
      </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import ReactiveAvatar from "@/components/Avatar/ReactiveAvatar.vue";
  
  const avatarRoot = ref(null);
  
  // 🎉 アバターのバウンス（Web Animations API）
  function bounceAvatar(el) {
    if (!el) return;
  
    el.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-25px)" },
        { transform: "translateY(0)" },
      ],
      {
        duration: 600,
        easing: "cubic-bezier(.28, .84, .42, 1)",
      }
    );
  }
  
  onMounted(() => {
    bounceAvatar(avatarRoot.value);
  });
  </script>
  
  <style scoped>
  .praise-wrapper {
    text-align: center;
    margin-top: 1.5rem;
  }
  
  .praise-message {
    font-size: 1.8rem;
    color: #7cf4b4;
    text-shadow: 0 0 12px #3ad197;
    margin-bottom: 1rem;
  }
  
  .avatar-bounce-root {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  </style>
  