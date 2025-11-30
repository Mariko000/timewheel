<!-- src/components/Avatar/ReactiveAvatar.vue -->
<template>
    <div class="reactive-avatar">
      <div class="avatar-wrapper">
        <img
          v-if="currentImage"
          :src="currentImage"
          :alt="`Avatar: ${mood}`"
          class="avatar-img"
          :class="{ 'fade-in': isFadingIn, 'fade-out': isFadingOut,
          'perfect': props.perfect
           }"
        />
      </div>
  
      <transition name="avatar-change" mode="out-in">
        <div class="speech-bubble" :key="message">
          {{ message }}
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from "vue";
  import "@/components/Avatar/avatar-bubble.css";
  
  const props = defineProps({
    mood: { type: String, default: "normal" },
    message: { type: String, default: "" },
    perfect: { type: Boolean, default: false }, 
  });
  
  // 画像マップ
  const moodMap = {
    normal: new URL("@/assets/avatar/normal3.png", import.meta.url).href,
    happy: new URL("@/assets/avatar/happy.png", import.meta.url).href,
    sad: new URL("@/assets/avatar/sad.png", import.meta.url).href,
    thinking: new URL("@/assets/avatar/thinking.png", import.meta.url).href,
    surprise: new URL("@/assets/avatar/surprise.png", import.meta.url).href,
    wink: new URL("@/assets/avatar/wink.png", import.meta.url).href,
  };
  
  const currentImage = ref(moodMap.normal);
  const isFadingIn = ref(false);
  const isFadingOut = ref(false);

  // ReactiveAvatar 側で perfect の変化を監視して一度だけアニメーションを発火

  watch(() => props.perfect, (newVal) => {
  if (newVal) {
    // 強制的に再レンダーしてアニメーションをリセット
    // 1回だけアニメーションを動かす
    const el = document.querySelector('.avatar-img');
    if (el) {
      el.classList.remove('perfect');
      void el.offsetWidth; // 再計算トリガー
      el.classList.add('perfect');
    }
  }
});
  
  // mood が変わったらフェードアニメーション
  watch(() => props.mood, (newMood) => {
  if (!moodMap[newMood]) return;
  isFadingOut.value = true;
  setTimeout(() => {
    currentImage.value = moodMap[newMood];
    isFadingOut.value = false;
    isFadingIn.value = true;
  }, 200);
});
  </script>
  
  <style scoped>
  .reactive-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  width: 100%;
  max-width: 480px;
  height: 140px; /* 💡全体の高さを固定 */
  position: relative;
}


.avatar-img.fade-out {
  opacity: 0;
  transform: scale(0.85);
}
.avatar-img.fade-in {
  opacity: 1;
  transform: scale(1);
}

/* アニメーション */
.avatar-change-enter-active,
.avatar-change-leave-active {
  transition: all 1.6s ease-in-out;
}
.avatar-change-enter-from,
.avatar-change-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.avatar-img.perfect {
  animation: avatar-tilt-side 3s ease-in-out infinite;/* 振動のスピード */
  transform-origin: center bottom; /* 回転の中心 */
}

/* 左右に45度傾くアニメーション */
@keyframes avatar-tilt-side {
  0%   { transform: rotate(-45deg); }
  25%  { transform: rotate(45deg); }
  50%  { transform: rotate(-45deg); }
  75%  { transform: rotate(45deg); }
  100% { transform: rotate(-45deg); }
}

  </style>
  