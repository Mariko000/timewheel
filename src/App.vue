<template>
  <TutorialOverlay />
  <router-view />
</template>

<script setup>
import { provide, onMounted, onUnmounted, ref } from 'vue'
import './page_design.css'
import TutorialOverlay from '@/components/Tutorial/TutorialOverlay.vue'
import { isFirstLaunch, markTutorialDone } from '@/components/Tutorial/tutorialFirstLaunch'
import { useTutorial } from '@/composables/useTutorial'
import { useScheduleStore } from '@/stores/scheduleStore'
import { subtractMinutes } from '@/stores/time.js'

const store = useScheduleStore()

// tutorial は単一インスタンス
const tutorial = useTutorial()
provide('tutorial', tutorial)

// 初回判定
const isFirstTutorial = ref(false)
const tutorialJudged = ref(false)

provide('isFirstTutorial', isFirstTutorial)
provide('tutorialJudged', tutorialJudged)

let reminderCheckTimer = null

onMounted(() => {
  if (tutorialJudged.value) return
  tutorialJudged.value = true

  const shouldShowTutorial = isFirstLaunch()
  isFirstTutorial.value = shouldShowTutorial

  console.log('tutorial 判定', { shouldShowTutorial })

  // schedule 初期化（チュートリアルと無関係）
  const todayKey = new Date().toISOString().slice(0, 10)
  store.loadSchedule(todayKey)

  if (!Array.isArray(store.schedule)) store.schedule = []
  store.saveSchedule(todayKey)
})


onUnmounted(() => {
  if (reminderCheckTimer) clearInterval(reminderCheckTimer)
  tutorial.stop()
})

function checkReminders() {
  const now = new Date()
  let modified = false

  store.schedule.forEach(item => {
    if (!item || item.reminderOffset === 'none') return
    if (!item.notified && item._reminderTime && new Date(item._reminderTime) <= now) {
      item.notified = true
      modified = true
    }
  })

  if (modified) store.saveSchedule()
}
</script>
