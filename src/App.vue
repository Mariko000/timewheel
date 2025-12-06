<template>
  <!-- force rebuild -->
  <!-- 後で導入予定 -->
  <router-view />
</template>

<script setup>
import './page_design.css'

// 全てのリマインダー・通知・SW管理
//Notification API 初回アプリ起動時に通知の権限をリクエスト
//main.js だと Vue がまだ完全に mount される前に動くのでここに
//Service Worker はブラウザに直接登録されるファイルなので、import する必要がない

import { onMounted, onUnmounted, ref } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { subtractMinutes } from '@/stores/time.js'

const store = useScheduleStore()
const swRegistration = ref(null)
let reminderCheckTimer = null

// -----------------
// Service Worker 初期化
// -----------------
async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js')
    swRegistration.value = reg
    console.log('SW registered:', reg)
  } catch (err) {
    console.error('SW registration failed:', err)
  }
}

// -----------------
// 通知送信
// -----------------
function sendNotification(message) {
  if (!swRegistration.value) {
    console.warn("⚠️ SW not ready yet. Notification skipped:", message)
    return
  }
  swRegistration.value.showNotification("TimeWheel ⏰", {
    body: message,
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png"
  })
  console.log("📣 通知送信:", message)
}

// -----------------
// リマインダー時間計算
// -----------------
function computeReminderTime(task) {
  if (!task.start || task.reminderOffset === "none") return null
  return subtractMinutes(task.start, Number(task.reminderOffset))
}

// -----------------
// リマインダー確認
// -----------------
function checkReminders() {
  const now = new Date()
  let modified = false
  store.schedule.forEach(item => {
    if (!item || item.reminderOffset === "none") return

    if (!item._reminderTime && item.start) {
      item._reminderTime = computeReminderTime(item)
      modified = true
    }

    if (!item.notified && item._reminderTime && item._reminderTime <= now) {
      sendNotification(item.activity)
      item.notified = true
      modified = true
    }
  })

  if (modified) store.saveSchedule()
}

// -----------------
// 全体通知設定を適用
// -----------------
function applyGlobalReminder() {
  const offset = store.globalReminderOffset
  store.schedule.forEach(item => {
    item.reminderOffset = offset
    item.notified = false
    if (item.start) item._reminderTime = offset !== "none" ? subtractMinutes(item.start, Number(offset)) : null
  })
  store.saveSchedule()
}


// -----------------
// 初期化
// -----------------
onMounted(async () => {
  await initServiceWorker()

  if ('Notification' in window) {
    Notification.requestPermission().then(result => console.log("通知権限:", result))
  }

  const todayKey = new Date().toISOString().slice(0,10)
  store.loadSchedule(todayKey)
  if (!Array.isArray(store.schedule)) store.schedule = []

  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
    if (item.reminderOffset === undefined) item.reminderOffset = store.globalReminderOffset
    if (item.notified === undefined) item.notified = false
    if (item.start) item._reminderTime = subtractMinutes(item.start, Number(item.reminderOffset))
  })
  store.saveSchedule(todayKey)

  // 少し遅らせて setInterval 開始
  setTimeout(() => {
    reminderCheckTimer = setInterval(checkReminders, 60*1000)
  }, 500)
})

onUnmounted(() => {
  if (reminderCheckTimer) clearInterval(reminderCheckTimer)
})
</script>

<style scoped>
/* 必要に応じて全体スタイルを追加 */
</style>
