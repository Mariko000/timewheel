<template>
   <CardLayout>
    <div class="galaxy-card schedule-detail">
      <h3 class="text-glow">{{ dateDisplay }} のスケジュール</h3>

        <!-- Todoコピー/ダウンロードボタン -->
  <button class="btn-copy" @click="copyTodo">リストをコピー</button>
  
      <div v-if="items.length">
        <li v-for="(item, idx) in items" :key="idx">
  <span class="activity-name">{{ item.activity }}</span>
  <span class="activity-time">{{ item.start }}〜{{ item.end }}</span>
  <span v-if="item.completed" class="check">✔</span>
</li>

      </div>
  
      <div v-else class="no-data">
        この日のスケジュールはありません。
      </div>
  
      <button @click="goBack" class="back-btn">← 戻る</button>
    </div>
  </CardLayout>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  const route = useRoute()
  const router = useRouter()
  
  // ▼ URL params から日付を取得
  const date = route.params.date
  
  // ▼ items 初期化
  const items = ref([])
  
  // ▼ 日付表示を MM/DD 形式に
  const dateDisplay = computed(() => {
    if (!date) return 'Invalid Date'
    const d = new Date(date)
    if (isNaN(d)) return 'Invalid Date'
    return d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
  })
  
  // ▼ localStorage からスケジュール読み込み
  onMounted(() => {
  if (!date) return
  const key = `scheduleData-${date}` // WeekData.vue と同じキー
  const saved = localStorage.getItem(key)
  if (saved) {
    const obj = JSON.parse(saved)
    items.value = obj.schedule ?? []  // schedule 配列を取り出す
  }
})


// 今日のTodoを整形したテキストに変換
function formatTodoText() {
  return items.value
    .map(item => `- ${item.activity} (${item.completed ? '完了' : '未完了'}) ${item.start}〜${item.end}`)
    .join('\n');
}


// クリップボードにコピー
async function copyTodo() {
  try {
    await navigator.clipboard.writeText(formatTodoText());
    alert('✅ Todoリストをコピーしました！');
  } catch (err) {
    console.error('コピーに失敗しました:', err);
  }
}


//トーストメッセージ
const toastMessage = ref('')
const showToast = ref(false)

function triggerToast(msg, duration = 2000) {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, duration)
}
  
  //  戻るボタン
  function goBack() {
    router.back()
  }
  </script>
  
  <style scoped>
  .schedule-detail {
    padding: 1rem;
    max-width: 420px;
    margin: 0 auto;
    color: #f0f8ff;
  }
  
  .no-data {
    margin-top: 1rem;
    font-style: italic;
    opacity: 0.8;
  }

  .schedule-detail li {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.activity-name {
  color: #fff;
  font-weight: 600;
}

.activity-time {
  opacity: 0.8;
  color: #d6e0ff;
}

.check {
  color: #7cf4b4;
  font-weight: bold;
}

.btn-copy,
.btn-download {
  background: linear-gradient(135deg, #ff72ff, #7cf4b4);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  font-weight: bold;
  margin-left: 0.5rem;
  transition: 0.2s;
}

.btn-copy:hover,
.btn-download:hover {
  opacity: 0.9;
}


  
  .back-btn {
    margin-top: 1rem;
    padding: 0.35rem 0.8rem;
    border-radius: 0.6rem;
    background: rgba(255,255,255,0.08);
    color: #cfe8ff;
    border: 1px solid rgba(255,255,255,0.2);
    cursor: pointer;
    transition: 0.2s;
  }
  
  .back-btn:hover {
    background: rgba(255,255,255,0.15);
  }
  </style>
  