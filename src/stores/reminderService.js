//通知を登録するJS not store.js
//FinishView.vue で使用

import { useScheduleStore } from '@/stores/scheduleStore'

const scheduleStore = useScheduleStore()

state: () => ({
    schedule: [],
    globalReminderOffset: "none" // ← これを全タスクに反映
  })

function addReminderToItem(id, minutesBefore) {
  const target = scheduleStore.schedule.find(item => item.id === id)
  if (!target) return

  target.reminderOffset = minutesBefore // ← 統一！
  scheduleStore.saveSchedule()
}
