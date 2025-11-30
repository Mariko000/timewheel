<template>
   <CardLayout>
  <div class="galaxy-card week-data-view">
    <h3 class="text-glow">📊 過去7日間の達成データ</h3>

    <!-- サマリー -->
    <div class="summary-section" v-if="Object.keys(recentScores).length">
      <div class="summary-item">
        <span class="label">平均達成率：</span>
        <span class="value">{{ averageRate }}%</span>
      </div>
      <div class="summary-item">
        <span class="label">最高スコア：</span>
        <span class="value">{{ maxRate }}%（{{ maxDateDisplay }}）</span>
      </div>
      <div class="summary-item">
        <span class="label">最低スコア：</span>
        <span class="value">{{ minRate }}%（{{ minDateDisplay }}）</span>
      </div>
    </div>

    <!-- ▼ テキストバー表示 -->
    <div class="bar-list" v-if="Object.keys(recentScores).length">
  <div
    v-for="(rate, date) in recentScores"
    :key="date"
    class="bar-item"
    @click="openSchedule(date)"
  >
    <!-- 日付を表示 -->
    <span class="date">{{ formatDateDisplay(date) }}</span>

    <!-- 横バー -->
    <span class="bar">{{ generateBar(rate) }}</span>

    <!-- 達成率 -->
    <span class="percent">{{ rate }}%</span>
  </div>
</div>


    <!-- ▼ アバター + コメント -->
<div class="avatar-message-wrapper">
  <ReactiveAvatar :mood="weekMood" />

  <ReactionMessage
    :messageKey="weekMessageKey"
    class="reaction-front"
  />
</div>

     <!-- 🔙 OpeningAnimation に戻る -->
     <button class="back-btn" @click="goBack">← ホームに戻る</button>


    <div v-if="Object.keys(recentScores).length === 0" class="no-data">
      <p>まだスコアデータがありません。</p>
    </div>
  </div>
</CardLayout>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ReactiveAvatar from '@/components/Avatar/ReactiveAvatar.vue'
import ReactionMessage from '@/components/Avatar/ReactionMessage.vue'
import { reactionMessages } from "@/components/Avatar/reactionMessages.js";

// ▼ 今日の日付
const today = new Date();

const habitScores = ref({})
const router = useRouter()

// ▼ 最新7日分の抽出
const recentScores = computed(() => {
  const entries = Object.entries(habitScores.value)
  const sorted = entries.sort((a, b) => a[0].localeCompare(b[0]))
  return Object.fromEntries(sorted.slice(-7))
})

// ▼ 平均・最大・最小
const averageRate = computed(() => {
  const values = Object.values(recentScores.value)
  if (!values.length) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
})

const maxRate = computed(() => Math.max(...Object.values(recentScores.value), 0))
const minRate = computed(() => Math.min(...Object.values(recentScores.value), 0))

const maxDateDisplay = computed(() => {
  const entries = Object.entries(recentScores.value)
  if (!entries.length) return '-'
  const maxEntry = entries.reduce((a, b) => (a[1] > b[1] ? a : b))
  return formatDateDisplay(maxEntry[0])
})

const minDateDisplay = computed(() => {
  const entries = Object.entries(recentScores.value)
  if (!entries.length) return '-'
  const minEntry = entries.reduce((a, b) => (a[1] < b[1] ? a : b))
  return formatDateDisplay(minEntry[0])
})

// ▼ 日付を MM/DD に整形
function formatDateDisplay(dateStr) {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}/${day}`
}

// ▼ バー生成（10〜15ブロックに正規化）
function generateBar(rate) {
  const maxBlocks = 15
  const blocks = Math.round((rate / 100) * maxBlocks)
  return '█'.repeat(blocks)
}

// ▼ ローカルストレージ読み込み
onMounted(() => {
  const stored = localStorage.getItem('habitScores')
  if (stored) habitScores.value = JSON.parse(stored)
})




// スケジュールにクリックイベント搭載
function openSchedule(date) {
  console.log('Clicked date:', date)  // 追加
  if (!date) {
    console.warn('date is empty!');
    return;
  }
  // 日付ごとに scheduleData-YYYY-MM-DD というキーで取り出す
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0,10);
  const key = `scheduleData-${dateStr}`;
  // LocalStorage から取得
  const raw = localStorage.getItem(key);
  const schedule = raw ? JSON.parse(raw) : [];

  console.log(`Schedule for ${dateStr}:`, schedule);

  

  // router で ScheduleDetail に遷移
  router.push({ name: 'scheduleDetail', params: { date: dateStr } })
}



// ▼ WeekData の mood を計算
const weekMood = computed(() => {
  if (averageRate.value === 100) return 'perfect'
  if (averageRate.value >= 80) return 'great'
  if (averageRate.value >= 50) return 'ok'
  return 'low'
})

// コメント候補をまとめた配列（null は除外する）
const rotationList = computed(() => {
  return [
    compareWithYesterday.value, // 前日比
    streakKey.value,            // 連続記録
    weekdayKey.value,           // 曜日
    timeKey.value,              // 時間帯

    // 最後にスコア（fallback）
    averageRate.value === 100 ? "happy"
      : averageRate.value >= 80 ? "good"
      : averageRate.value >= 50 ? "normal"
      : "low"
  ].filter(v => v !== null); // null は除外
});

const rotationIndex = ref(0);

const weekMessageKey = computed(() => {
  return rotationList.value[rotationIndex.value] || "normal";
});



// ▼ 曜日コメント
const weekdayKey = computed(() => {
  const w = today.getDay();
  return [
    "weekdaySun",
    "weekdayMon",
    "weekdayTue",
    "weekdayWed",
    "weekdayThu",
    "weekdayFri",
    "weekdaySat"
  ][w];
});

// ▼ 時間帯コメント
const timeKey = computed(() => {
  const h = today.getHours();
  if (h < 12) return "timeMorning";
  if (h < 18) return "timeAfternoon";
  return "timeNight";
});

// ▼ 前日比ロジック
const yesterdayKey = computed(() => {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10); // "2025-11-19"
});

const yesterdayRate = computed(() => {
  return habitScores.value[yesterdayKey.value] ?? null;
});

const compareWithYesterday = computed(() => {
  if (yesterdayRate.value == null) return null;

  const todayRate = averageRate.value;

  if (todayRate > yesterdayRate.value) return "betterThanYesterday";
  if (todayRate < yesterdayRate.value) return "worseThanYesterday";

  return null;
});

// ▼ 連続達成ロジック
const streakKey = computed(() => {
  let streak = 0;
  const entries = Object.entries(recentScores.value).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i][1] >= 50) streak++;
    else break;
  }

  if (streak >= 3) return "keepStreak";
  if (streak === 0) return "breakStreak";

  return null;
});

onMounted(() => {
  setInterval(() => {
    if (rotationList.value.length === 0) return;
    rotationIndex.value =
      (rotationIndex.value + 1) % rotationList.value.length;
  }, 5000); // 5秒ごと
});


function goBack() {
  router.push('/')
}
</script>


<style scoped>
.week-data-view {
  padding: 1rem;
  color: #f0f8ff;
  max-width: 420px;
  margin: 0 auto;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0.5rem 0;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
}

.summary-item {
  font-size: 1rem;
}

.label {
  color: #a6c8ff;
}

.value {
  font-weight: 600;
  color: #7cf4b4;
}

/* ▼ 横バー表示 */
.bar-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.95rem;
}

.date {
  width: 3.5rem;
  color: #cfe8ff;
}

.bar {
  flex-grow: 1;
  white-space: pre;
  color: #7cf4b4;
}

.percent {
  width: 3rem;
  text-align: right;
  color: #a6c8ff;
}

.no-data {
  margin-top: 1.5rem;
  font-style: italic;
  opacity: 0.8;
}

.back-btn {
  background: rgba(255,255,255,0.08);
  color: #cfe8ff;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 0.35rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
  cursor: pointer;
  transition: 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.15);
}


/* ▼ アバター＋コメントのレイアウト */
.avatar-message-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 1.2rem;
}

/* コメント（吹き出し）をアバター前面へ */
.reaction-front {
  position: absolute;
  width: 300px;
  left: 25%;
  top: 68px;
  z-index: 999;
  color: #000;
}

</style>
