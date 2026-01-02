<template>
   <CardLayout>
  <!-- 外側に .galaxy-card を付与して宇宙系背景を page_design.css に統一 -->
  <div class="galaxy-card schedule-preview" :class="viewMode">
    <h3 class="text-glow">スケジュールプレビュー</h3>

    <!-- oversleep 警告バー -->
    <div v-if="store.oversleepAlert" class="alert-bar">
      スケジュールが就寝時間を超えそうです。
    </div>

    <!-- View Toggle（切替ボタンは .btn-outline で統一） -->
    <div class="view-toggle">
      <button
        class="btn-outline"
        :class="{ active: viewMode === 'wheel' }"
        @click="viewMode = 'wheel'"
        id="wheel_schedule"
      >
        ホイール型
      </button>
      <button
        class="btn-outline"
        :class="{ active: viewMode === 'list' }"
        @click="viewMode = 'list'"
        id="list_schedule"
      >
        ノート型
      </button>
    </div>

    <!-- 編集モード切替 -->
    <div class="edit-toggle">
      <button class="btn-outline" @click="toggleEditMode">
        {{ editMode ? '閲覧モード' : ' 編集モード' }}
      </button>
    </div>

    <transition name="slide-fade" mode="out-in">
      <div :key="viewMode">
        <!-- ホイールビュー -->
        <div v-if="viewMode === 'wheel'" class="chart-container">
          <div class="am-pm-labels">
            <div>就寝</div>
            <div>起床</div>
          </div>
          <canvas ref="wheelChart"></canvas>
        </div>

        <!-- ノートビュー -->
        <div v-else class="note-list-container">
          <p class="time">起床：{{ store.wakeTime }}</p>
          <draggable
            v-model="store.schedule"
            item-key="id"
            animation="200"
            class="note-list"
            @end="onReorder"
            @update="onReorder"
            :disabled="!editMode"
          >
          <template #item="{ element }">
            <div class="note-item" :class="{ 'edit-mode': editMode }">
  <!-- 左側：⠿ + アクティビティ名 + 時間 -->
  <div class="activity-left">
    <span class="activity-name drag-handle">⠿ {{ element.activity }}</span>
    <span v-if="!editMode" class="activity-time-text">{{ element.start }}〜{{ element.end }}</span>
    <div v-else class="edit-controls">
      <input type="text" v-model="element.start" @change="updateTime(element.id,'start',element.start)" />
      <span class="time-separator">〜</span>
      <input type="text" v-model="element.end" @change="updateTime(element.id,'end',element.end)" />
    </div>
  </div>

  <!-- 右端：削除ボタン -->
  <button v-if="editMode" class="delete-btn" @click="deleteSlot(element.id)">🗑️</button>
</div>


</template>


          </draggable>
          <p class="time">就寝：{{ store.sleepTime }}</p>
        </div>
      </div>
    </transition>

    <!-- アバター（そのまま） -->
    <div class="guide-avatar-box">
      <GuideAvatar
        :mood="currentReaction.mood"
        :message="currentReaction.text"
      />
    </div>

    <!-- ボタン群：戻る・確定（.btn-neon）・リセット -->
    <div class="button-row">
      <button @click="goBack" class="btn-outline back-btn">戻る</button>
      <button @click="confirmSchedule" class="btn-neon confirm-btn">確定</button>
       <!-- リセット 
      <button @click="resetSchedule" class="btn-outline reset-btn">🗑️</button>-->
    </div>
  </div>
  </CardLayout>
</template>

<script setup>
import { ref, onMounted, onUpdated, watch, nextTick, inject } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js'
import pattern from 'patternomaly'
import GuideAvatar from '@/components/Avatar/GuideAvatar.vue' 

const scheduleStore = useScheduleStore()
// アバターリアクション
const reactionQueue = ref([])
const currentReactionIndex = ref(0)
const currentReaction = ref({ mood: 'normal', text: '' })
let reactionTimer = null

Chart.register(PieController, ArcElement, Tooltip, Legend)

const store = useScheduleStore()
const router = useRouter()
const viewMode = ref('wheel')
const wheelChart = ref(null)
const editMode = ref(false)
let chartInstance = null

onMounted(async () => {
  console.log("SchedulePreview マウント")
  console.log(" 保存されている activities:", store.activities)

  // スケジュールをまだ生成していない場合は自動生成
  if (!store.schedule || store.schedule.length === 0) {
    console.log("スケジュールを自動生成します…")
    await store.generateSchedule()
  }

  console.log("生成後の schedule:", store.schedule)
  renderChart()
})

// チュートリアル
import { getSchedulePreviewSteps } from '@/composables/useTutorialSteps'
import { isTutorialDone, markTutorialDoneFor } from '@/components/Tutorial/tutorialProgress'

// App.vue から注入
const tutorial = inject('tutorial')
const isFirstTutorial = inject('isFirstTutorial', ref(false))

watch(
  isFirstTutorial,
  async (val) => {
    if (!val) return
    if (!tutorial) return
    if (isTutorialDone('schedulePreview')) return

    console.log('SchedulePreview: チュートリアル開始')

    await nextTick()

    tutorial.start(getSchedulePreviewSteps(), {
      onFinish: () => {
        markTutorialDoneFor('schedulePreview')
      }
    })
  },
  { immediate: true }
)

//onMounted(() => {
    // 3. 判定が true の場合のみ開始する
   // if (isFirstTutorial) {
  //tutorial.start(getSchedulePreviewSteps())
//}
//})




// --- 編集モード切替 ---
function toggleEditMode() {
  editMode.value = !editMode.value
}

// --- 個別削除 ---
function deleteSlot(id) {
  if (confirm('このスロットを削除しますか？')) {
    store.removeSlot(id)
    store.saveSchedule()
  }
}



// --- 時間更新 ---
function updateTime(id, field, value) {
  // 入力文字列を分に変換
  const minutes = store.parseFlexibleTime(value)
  if (minutes === null) {
    alert('正しい時刻形式（HH:MM）で入力してください')
    return
  }

  // 分 → HH:MM フォーマットに整形して store に反映
  const formatted = store.formatFlexible(minutes)
  store.updateScheduleTime(id, field, formatted)
}


// --- ドラッグ後再計算 ---

function onReorder() {
  // 並び替え後の schedule は v-model により既に更新済みなので
  // store へ保存だけすれば十分
  scheduleStore.saveSchedule()

  // 長さや順序に応じて時刻を再生成
  if (typeof scheduleStore.recalculateSchedule === "function") {
    scheduleStore.recalculateSchedule()
  }

  console.log("✔ 並び替え → 保存 → 再計算 完了")
}


//async function onReorder() {
  //await nextTick()
  //let [currentHour, currentMin] = store.wakeTime.split(':').map(Number)

  //const updated = store.schedule.map(a => {
    //const duration = store.toMinutes(a.end) - store.toMinutes(a.start)
    //const start = `${String(currentHour).padStart(2,'0')}:${String(currentMin).padStart(2,'0')}`
    //const endTotal = currentHour*60 + currentMin + duration
    //const endHour = Math.floor(endTotal/60)
    //const endMin = endTotal % 60
    //const end = `${String(endHour).padStart(2,'0')}:${String(endMin).padStart(2,'0')}`
    //currentHour = endHour
    //currentMin = endMin
    //return { ...a, start, end }
  //})

  //store.schedule = [...updated]
  //store.saveSchedule()
  //renderChart()
  //if (store.oversleepAlert) console.log('睡眠時間オーバー！')
//}

// --- チャート描画 ---
function renderChart() {
  if (!wheelChart.value) return
  if (chartInstance) chartInstance.destroy()

  const labels = store.schedule.map(s => s.activity)
  const totalMinutes = 24*60
  const wakeMinutes = store.toMinutes(store.wakeTime)

  const durations = store.schedule.map(s => {
    const [sh, sm] = s.start.split(':').map(Number)
    const [eh, em] = s.end.split(':').map(Number)
    const startM = ((sh*60+sm)-wakeMinutes+totalMinutes)%totalMinutes
    const endM = ((eh*60+em)-wakeMinutes+totalMinutes)%totalMinutes
    return endM>=startM ? endM-startM : totalMinutes-startM+endM
  })

  const grayRules = {
    '起床':'#e5e5e5','就寝':'#666666','朝食':'#FFDDEE','夕食':'#DDEEFF',
    '朝の準備':'#FFE6F0','夕方準備':'#E6F0FF','休憩':'#cccccc',
    '通勤':'#bdbdbd','通学':'#bdbdbd','勤務':'#999999','学校':'#999999','休日':'#999999'
  }

  const vividPalette = ['#FF4C4C','#FF9900','#FFD300','#00C851','#33B5E5','#4285F4','#AA66CC','#FF5E99','#00BFA5','#FF8C42']
  const colorMap = new Map()
  let vividIndex = 0

  const colors = labels.map(label => {
  const clean = label.replace(/^[^\w一-龠ぁ-んァ-ン]+/,'').replace(/（行き）|（帰り）/g,'').trim()

  // 通勤・通学はパターンのまま
  if (clean === '通勤' || clean === '通学') return pattern.draw('diagonal', '#bdbdbd', '#888888')

  // その他のグレー系ベタ塗りに統一
  if (['学校','早番シフト','日勤帯','夜勤帯①','夜勤帯②','休日','カスタム'].includes(clean)) {
    return '#999999'  // ベタ塗りグレー
  }

  // 既存の色指定ルール
  if (grayRules[clean]) return grayRules[clean]

  // ランダム配色
  if (!colorMap.has(clean)) {
    colorMap.set(clean, vividPalette[vividIndex % vividPalette.length])
    vividIndex++
  }
  return colorMap.get(clean)
})


  chartInstance = new Chart(wheelChart.value,{
    type:'doughnut',
    data:{ labels, datasets:[{ data:durations, backgroundColor:colors, borderColor:'#fff', borderWidth:2 }] },
    options:{
      rotation:-Math.PI/2,
      circumference:360,
      cutout:'50%',
      plugins:{
        legend:{ position:'bottom', labels:{ boxWidth:20, padding:15,color: '#f8faff'}},
        tooltip: {
          bodyColor: '#fff',    // ← ★ tooltip 内文
          titleColor: '#fff',
          callbacks: {
          label: ctx => {
          const dur = ctx.raw
          const h = Math.floor(dur / 60)
          const m = dur % 60
          return `${ctx.label}: ${h}時間${m}分`
        }
          }
        }
      }
    }
  })
}
// --- アバターリアクション ---
//アクセス・更新する時にref()にアクセスするため .value が必要


reactionQueue.value = [
  { mood: 'normal', text: '今日はこんなスケジュールだね！' },
  { mood: 'idea', text: '💡 隙間時間に読書を入れてみようか？' },
  { mood: 'relax', text: '終わったらストレッチもおすすめ！' },
]

// --- 隙間時間検出＋oversleep時メッセージ ---
watch(
  () => store.schedule,
  async (newSchedule) => {
    const gaps = []
    const relaxMessages = [
      'コーヒーでひと息どう？',
      '5分だけ読書すると、いい気分転換になるよ',
      '深呼吸して、頭をスッキリさせよう。',
      '軽く散歩して体を動かそう！',
      'リラックスする時間だね。深呼吸しよう。'
    ]

    for (let i = 0; i < newSchedule.length - 1; i++) {
      const current = newSchedule[i]
      const next = newSchedule[i + 1]
      const end = store.toMinutes(current.end)
      const nextStart = store.toMinutes(next.start)
      const gapDuration = nextStart - end

      // 休憩または10分以上の隙間を検出
      if (current.activity.includes('休憩') || gapDuration >= 10) {
        const randomMsg = relaxMessages[Math.floor(Math.random() * relaxMessages.length)]
        gaps.push({
          mood: 'relax',
          text: current.activity.includes('休憩')
            ? `休憩時間があるね。${randomMsg}`
            : `${gapDuration}分の隙間時間を発見！${randomMsg}`
        })
      }
    }

    const reactions = [
      { mood: 'normal', text: '今日のスケジュールを確認しよう！' },
      ...gaps
    ]

    if (store.oversleepAlert) {
      reactions.push({
        mood: 'alert',
        text: '就寝時間を超えそう！少しスケジュールを調整しよう！'
      })
    }

    reactions.push({
      mood: 'idea',
      text: '1日を上手に使えてるね！'
    })

    reactionQueue.value = reactions
    currentReactionIndex.value = 0
    showNextReaction()
  },
  { deep: true, immediate: true }
)

function showNextReaction() {
  if (reactionTimer) clearTimeout(reactionTimer)

  // 現在のリアクションを更新
  currentReaction.value = reactionQueue.value[currentReactionIndex.value]

  // インデックスを進める（最後まで行ったら0に戻る）
  currentReactionIndex.value = (currentReactionIndex.value + 1) % reactionQueue.value.length

  // 次のリアクションを3.2秒ごとにループ再生
  reactionTimer = setTimeout(showNextReaction, 3200)
}




// --- 初期化 ---
// onMounted: 常に最新の activities から schedule を生成（条件を外す）
onMounted(() => {
  // activities があるなら必ず生成（ActivityInput -> 戻ってきたときの同期対策）
  store.generateScheduleWithId()
  renderChart()
})

// watch: activities が変わったら再生成して描画
watch(() => store.activities, async (newActs) => {
  // activities が変更されたら schedule を再生成して描画
  store.generateScheduleWithId()
  await nextTick()
  renderChart()
}, { deep: true })



watch(viewMode,v=>{ if(v==='wheel') renderChart() })

onUpdated(()=>{ if(viewMode.value==='wheel') renderChart() })

watch(() => store.schedule, async () => {
  await nextTick()
  renderChart()
}, { deep:true, immediate:true })

function confirmSchedule(){
  const invalid = store.schedule.find(s => store.parseFlexibleTime(s.start) === null || store.parseFlexibleTime(s.end) === null)
  if (invalid) {
    alert(`スロット ${invalid.activity} の時間が不正です`)
    return
  }
  store.saveSchedule()
  alert('スケジュールを登録しました')
  router.push('/FinishView')
}


// 今日の日付キー（例：2025-11-12）=「本日の稼働Todoリスト」としてここで定義
//次はFinishView.vue に遷移

//戻る
function goBack() {
  router.push({ name: 'OpeningAnimation' })
}

// --- リセット ---
function resetSchedule() {
  if(confirm('⚠️過去のデータを全部消去しますか？')) {
    localStorage.clear()
    alert(' データを削除しました')
    store.generateScheduleWithId()
    renderChart()
  }
}
</script>


<style scoped>

.schedule-preview {
  /* 幅などは元ファイルを踏襲（背景は page_design.css の .galaxy-card に任せる） */
  position: relative;
  max-width: 600px;
  margin: 1.8rem auto;
  padding: 1.4rem;
  border-radius: 1.2rem;
  overflow: visible;
}

/* chart の高さ確保だけ確実に（page_design.css の粒子等に干渉しない） */
.chart-container { min-height: 320px; }

/* 全体の縦リスト */
.note-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;             /* 上に出す */
}
.note-item {
  position: relative;    /* z-index が効くように */
  display: flex;           /* 横並びは維持 */
  align-items: flex-start;
  justify-content: space-between; /* 左:アクティビティ / 右:削除ボタン */
  gap: 0.6rem;
  background: linear-gradient(145deg, rgba(100, 120, 255, 0.12), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(170, 200, 255, 0.7);
  box-shadow: 0 0 10px rgba(130, 200, 255, 0.4);
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  transition: transform .2s ease, box-shadow .3s ease;
  pointer-events: auto;
  z-index: 1;
}

.activity-left {
  display: flex;
  flex-direction: column;  /* ⠿ + 名前 + 時間を縦に積む */
  align-items: flex-start; /* 左端揃え */
  gap: 0.2rem;
}

/* ドラッグハンドル */
.drag-handle {
  cursor: grab;
  display: inline-flex;       /* inline-block → inline-flex に変更 */
  align-items: center;        /* 中央揃え */
  justify-content: center;    /* 中央揃え */
  padding: 4px 8px;           /* 範囲を広げる */
  user-select: none;
  font-weight: 600;
  color: #fff;
  z-index: 4;                 /* 上に出す */
}


/* 編集モードの input と削除ボタン横並び */
.edit-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
}
/* アクティビティ名 + 時間を縦にしたい場合 */
.note-item > div:first-child {
  display: flex;
  flex-direction: column;  /* アクティビティ名と時間だけ縦に積む */
  line-height: 1.3;
}

/* 編集モード時の note-item の外枠を消す */
.note-item.edit-mode {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0.6rem 0.9rem; /* レイアウト崩れ防止 */
  pointer-events: auto;
}
.note-item::before {
    pointer-events: none;
}

.note-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 12px rgba(180, 220, 255, 0.5);
}

/* アクティビティ名 + 時間縦積み */
.activity-time {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

/* アクティビティ名の強調 */
.activity-name {
  font-weight: 600;
}

/* 閲覧モードの時間表示 */
.activity-time-text {
  font-size: 0.9rem;
  color: #aaa;
}





/* view-toggle / edit-toggle 内の .active は page_design.css と一貫するように */
.view-toggle, .edit-toggle { display:flex; justify-content:center; gap:1rem; margin-bottom:1rem; }

.button-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem; /* 少し広げると押しやすくなります */
  margin-top: 1.5rem;
  align-items: stretch; /* 子要素の高さを揃える */
}

.button-row button {
  /* 高さを固定し、padding の干渉を防ぐ */
  height: 48px;
  flex: 1;           /* 両方のボタンを同じ幅にする（不要なら削除） */
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 重要なプロパティ：これらで外枠と余白をリセット */
  box-sizing: border-box; 
  padding: 0 1rem;    /* 左右のみ余白、上下は height に任せる */
  line-height: 1;
  margin: 0;
}

/* 枠線の太さが違う場合の微調整 */
.back-btn {
  border: 1px solid rgba(170, 200, 255, 0.7) !important;
}

.confirm-btn {
  /* neonボタンに border がある場合は合わせる */
  border: 1px solid transparent !important; 
  font-weight: bold;
}

/* deleteボタンの白背景を削除 */
.delete-btn {
  background: transparent;
  border: none;
  padding: 0.3rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.delete-btn:hover { transform: scale(1.2); }





</style>