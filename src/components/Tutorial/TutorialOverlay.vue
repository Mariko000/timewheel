<template>
  <div class="tutorial-overlay" v-if="rect">
    <div class="overlay-dark" :style="overlayStyle"></div>
    <!--説明文-->
    <div v-if="active && message"
    class="tutorial-message">
  {{ message }}
</div>
  </div>
</template>


<script setup>
  import { computed } from 'vue'
  import { useSpotlight } from '@/composables/useSpotlight'
  import { useTutorial } from '@/composables/useTutorial'
  
  // spotlight
  const { rect } = useSpotlight()
  
  // tutorial state（ここが重要）
  const tutorial = useTutorial()
  const message = tutorial.currentMessage
  const active = tutorial.active   // ← ★ これを追加
  
  const overlayStyle = computed(() => {
    const r = rect.value
    if (!r) return {}
  
    const radius = Math.max(r.width, r.height) / 2 + 16
  
    return {
      WebkitMask: `radial-gradient(
        circle ${radius}px
        at ${r.left + r.width / 2}px ${r.top + r.height / 2}px,
        transparent 0%,
        transparent 70%,
        black 71%
      )`,
      mask: `radial-gradient(
        circle ${radius}px
        at ${r.left + r.width / 2}px ${r.top + r.height / 2}px,
        transparent 0%,
        transparent 70%,
        black 71%
      )`,
      background: 'rgba(0,0,0,0.5)',
    }
  })
  </script>
  


<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.overlay-dark {
  position: absolute;
  inset: 0;
}

/*説明文 */
.tutorial-message {
  position: fixed;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border-radius: 12px;
  font-size: 0.95rem;
  text-align: center;
  pointer-events: none;
}

.tutorial-message:empty {
  display: none;
}

</style>
