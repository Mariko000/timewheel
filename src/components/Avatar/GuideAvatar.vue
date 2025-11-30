 <!-- SchedulePreview 用（提案・案内）-->

 <template>
    <div class="guide-avatar">
      <transition name="avatar-change" mode="out-in">
        <img
          v-if="currentMoodImage"
          :key="currentMoodImage"
          :src="currentMoodImage"
          alt="Guide Avatar"
          class="avatar-img"
        />
      </transition>
  
      <transition name="avatar-change" mode="out-in">
        <div class="speech-bubble" :key="message">
          {{ message }}
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { computed } from "vue";
  import "@/components/Avatar/avatar-bubble.css";
  
  const props = defineProps({
    mood: {
      type: String,
      default: "normal", // normal | thinking | happy | idea | relax | alert
    },
    message: {
      type: String,
      default: "",
    },
  });
  
  // === 表情ファイルマップ ===
  const moodMap = {
    normal: new URL("@/assets/avatar/normal3.png", import.meta.url).href,
    thinking: new URL("@/assets/avatar/thinking.png", import.meta.url).href,
    happy: new URL("@/assets/avatar/happy.png", import.meta.url).href,
    idea: new URL("@/assets/avatar/idea.png", import.meta.url).href,
    relax: new URL("@/assets/avatar/relax.png", import.meta.url).href,
    alert: new URL("@/assets/avatar/alert.png", import.meta.url).href,
  };
  
  const currentMoodImage = computed(() => moodMap[props.mood] || moodMap.normal);
  </script>
  
  <style scoped>
  .guide-avatar {
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
  transition: all 0.6s ease-in-out;
}
.avatar-change-enter-from,
.avatar-change-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
  </style>
  