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
  // 二重判定防止
  if (tutorialJudged.value) return
  tutorialJudged.value = true

  const allKeys = Object.keys(localStorage)
  const hasAnyPastData = allKeys.some(key => key.startsWith('scheduleData-'))
  const isFirstFlag = isFirstLaunch()

  const shouldShowTutorial = isFirstFlag && !hasAnyPastData
  isFirstTutorial.value = shouldShowTutorial

  console.log('tutorial 判定', {
    allKeys,
    hasAnyPastData,
    isFirstFlag,
    shouldShowTutorial
  })

  // schedule 初期化
  const todayKey = new Date().toISOString().slice(0, 10)
  store.loadSchedule(todayKey)

  if (!Array.isArray(store.schedule)) store.schedule = []

  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
    if (item.reminderOffset === undefined) item.reminderOffset = store.globalReminderOffset
    if (item.notified === undefined) item.notified = false
    if (item.start) {
      item._reminderTime = subtractMinutes(
        item.start,
        Number(item.reminderOffset)
      )
    }
  })

  store.saveSchedule(todayKey)

  if (!shouldShowTutorial && isFirstFlag) {
    markTutorialDone()
  }

  reminderCheckTimer = setInterval(checkReminders, 60 * 1000)
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
