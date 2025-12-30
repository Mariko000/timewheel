<template>
  <TutorialOverlay />
  <router-view />
</template>

<script setup>
import { provide, onMounted, onUnmounted, ref, nextTick } from 'vue'
import './page_design.css'
import TutorialOverlay from '@/components/Tutorial/TutorialOverlay.vue'
import { isFirstLaunch, markTutorialDone } from '@/components/Tutorial/tutorialFirstLaunch'
import { useTutorial } from '@/composables/useTutorial'
import { useScheduleStore } from '@/stores/scheduleStore'
import { subtractMinutes } from '@/stores/time.js'

// 外部からステップ定義を読み込む（もしOpeningAnimation以外でも使うなら）
// import { getOpeningSteps } from '@/composables/useTutorialSteps' 

const store = useScheduleStore()
const tutorial = useTutorial()
const swRegistration = ref(null)
let reminderCheckTimer = null

//チュートリアルが再生される条件：
//チュートリアル完了フラグ（timewheel_tutorial_done）」が LocalStorage に存在しない（isFirstLaunch() が true）
//LocalStorage 内に scheduleData- で始まるキー（過去のスケジュール入力跡）が一つもない（hasAnyPastData が false）

// setup直下で宣言し、子コンポーネントがリアクティブに変化を検知できるようにする
const isFirstTutorial = ref(false)
provide('isFirstTutorial', isFirstTutorial)

onMounted(async () => {
  // --- 2. 判定を「データの保存」より前に行う ---
  const allKeys = Object.keys(localStorage)
  const hasAnyPastData = allKeys.some(key => key.startsWith('scheduleData-'))
  const isFirstFlag = isFirstLaunch()

  // チュートリアルを表示すべきか判定
  const shouldShowTutorial = isFirstFlag && !hasAnyPastData
  isFirstTutorial.value = shouldShowTutorial

  console.log("① LocalStorage内の全キー:", allKeys)
  console.log("② schedule_ で始まるキーが見つかったか:", hasAnyPastData)
  console.log("③ チュートリアル完了フラグ（isFirstLaunch）:", isFirstFlag)

  // 1. 初期化系（Service Worker & 通知）
  await initServiceWorker()
  if ('Notification' in window) {
    Notification.requestPermission()
  }

  // 2. 今日のデータをロードと初期保存（判定の後に実行）
  const todayKey = new Date().toISOString().slice(0, 10)
  store.loadSchedule(todayKey)
  if (!Array.isArray(store.schedule)) store.schedule = []
  
  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
    if (item.reminderOffset === undefined) item.reminderOffset = store.globalReminderOffset
    if (item.notified === undefined) item.notified = false
    if (item.start) item._reminderTime = subtractMinutes(item.start, Number(item.reminderOffset))
  })
  
  // ここで保存することで、次回の起動からは shouldShowTutorial が false になる
  store.saveSchedule(todayKey)

  // 3. 実行ロジック
  if (shouldShowTutorial) {
    console.log("👉 判定結果: 初回かつデータ無し。チュートリアルを開始します。")
    // ※ 実際の開始処理は各コンポーネント側の onMounted で inject を見て判断される
    // もし App.vue 自体で開始させる必要がある場合は以下を有効化
    /*
    await nextTick()
    setTimeout(() => {
      if (!tutorial.active.value && typeof getOpeningSteps === 'function') {
         tutorial.start(getOpeningSteps()) 
         markTutorialDone()
      }
    }, 1000)
    */
  } else {
    console.log("👉 判定結果: チュートリアルは不要です。理由:", { 
      "既読フラグがある": !isFirstFlag, 
      "過去データがある": hasAnyPastData 
    })
    // 既にデータがある場合は、チュートリアルを「完了」扱いにしておく
    if (isFirstFlag) markTutorialDone() 
  }

  // 4. リマインダー監視開始
  setTimeout(() => {
    reminderCheckTimer = setInterval(checkReminders, 60 * 1000)
  }, 500)
})

onUnmounted(() => {
  if (reminderCheckTimer) clearInterval(reminderCheckTimer)
  tutorial.stop()
})

// --- メソッド定義 ---
async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js')
    swRegistration.value = reg
  } catch (err) {
    console.error('SW registration failed:', err)
  }
}

function sendNotification(message) {
  if (!swRegistration.value) return
  swRegistration.value.showNotification("TimeWheel", {
    body: message,
    icon: "/web-app-manifest-192x192.png"
  })
}

function checkReminders() {
  const now = new Date()
  let modified = false
  store.schedule.forEach(item => {
    if (!item || item.reminderOffset === "none") return
    if (!item.notified && item._reminderTime && new Date(item._reminderTime) <= now) {
      sendNotification(item.activity)
      item.notified = true
      modified = true
    }
  })
  if (modified) store.saveSchedule()
}
</script>