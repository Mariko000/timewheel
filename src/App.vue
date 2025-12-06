<template>
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
    // SW登録
    await navigator.serviceWorker.register('/service-worker.js')
    console.log('SW registered')

    // ready を待って swRegistration に格納
    swRegistration.value = await navigator.serviceWorker.ready
    console.log('SW ready:', swRegistration.value)
  } catch (err) {
    console.error('SW registration failed:', err)
  }
}

// -----------------
// 安全な通知送信
// -----------------
function sendNotification(message) {
  if (!swRegistration.value) {
    console.warn("⚠️ SW not ready yet. Notification skipped:", message)
    return
  }
  swRegistration.value.showNotification("TimeWheel 通知", {
    body: message,
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png"
  })
  console.log("📣 通知送信:", message)
}

// -----------------
// リマインダー処理
// -----------------
function computeReminderTime(task) {
  if (task.reminderOffset === "none" || !task.start) return null
  const [h, m] = task.start.split(":").map(Number)
  const date = new Date()
  date.setHours(h)
  date.setMinutes(m)
  date.setSeconds(0)
  date.setMilliseconds(0)
  date.setMinutes(date.getMinutes() - Number(task.reminderOffset))
  return date
}

function checkReminders() {
  const now = new Date()
  store.schedule.forEach(item => {
    if (!item || item.reminderOffset === "none") return
    if (!item._reminderTime) item._reminderTime = computeReminderTime(item)
    if (!item.notified && item._reminderTime <= now) {
      sendNotification(item.activity)  // sendReminder → sendNotification に統一
      item.notified = true
      store.saveSchedule()
    }
  })
}

// -----------------
// 全体通知設定適用
// -----------------
function applyGlobalReminder() {
  const offset = store.globalReminderOffset
  store.schedule.forEach(item => {
    item.reminderOffset = offset
    item.notified = false
    if (offset !== "none" && item.start) {
      item._reminderTime = subtractMinutes(item.start, Number(offset))
    }
  })
  store.saveSchedule()
  console.log(offset === "none" ? "⏹ 全通知オフ" : `🔔 全タスク通知を "${offset}分前" に再設定`)
}

// -----------------
// 初期化
// -----------------
onMounted(async () => {
  await initServiceWorker()   // SW登録・ready を待つ

  // 通知権限リクエスト
  if ('Notification' in window) {
    Notification.requestPermission().then(result => console.log("通知権限:", result))
  }

  // store 初期化
  const todayKey = new Date().toISOString().slice(0,10)
  store.loadSchedule(todayKey)
  if (!Array.isArray(store.schedule)) store.schedule = []

  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
    if (item.reminderOffset === undefined) item.reminderOffset = store.globalReminderOffset
    if (item.notified === undefined) item.notified = false
    item._reminderTime = item.start ? subtractMinutes(item.start, Number(item.reminderOffset)) : null
  })
  store.saveSchedule(todayKey)

  // リマインダー開始（1分ごと）
  reminderCheckTimer = setInterval(checkReminders, 60*1000)
})

onUnmounted(() => {
  if (reminderCheckTimer) clearInterval(reminderCheckTimer)
})
</script>

<style scoped>
/* 必要に応じて全体スタイルを追加 */
</style>
