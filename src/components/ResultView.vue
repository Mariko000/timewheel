 <!-- 当日の達成率の計算-->

 <template>
   <CardLayout>
  <div class="galaxy-card result-view">
    <h3 class="text-glow">今日の達成結果</h3>

    <div v-if="loaded">
      <p class="score-text">今日の達成率：<span class="score">{{ progressRate }}%</span></p>

      <!--  アバター -->
      <div class="avatar-message-wrapper">
       <!-- アバター（擬似アニメーション付き） -->
      <ReactiveAvatar :mood="mood" :perfect="perfectAnimation"/>

       <!-- コメント（mood & messageKey で切り替え） -->
      <ReactionMessage :messageKey="messageKey"
      class="reaction-front" />
      </div>


      <!-- ボタン -->
      <div class="button-area">
        <button class="btn-week" @click="goToWeekData">1週間の推移を見る</button>
      </div>

           <!-- 🔙 OpeningAnimation に戻る -->
           <button class="btn-outline back-btn" @click="goBack">← ホームに戻る</button>
    </div>

    <div v-else>
      <p>データを読み込み中...</p>
    </div>
  </div>
</CardLayout>
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch,nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/scheduleStore'

// リアクションセット
import ReactiveAvatar from '@/components/Avatar/ReactiveAvatar.vue'
import ReactionMessage from '@/components/Avatar/ReactionMessage.vue'
import { reactionMessages } from "@/components/Avatar/reactionMessages.js";

// 風船アニメーション
import { launchBalloonAnimation } from '@/components/Avatar/completemotions.js'


// Pinia store & router
const store = useScheduleStore()
const router = useRouter()
const loaded = ref(false)



const balloonsLaunched = ref(false)

const perfectAnimation = ref(false);


// 今日の日付キーを取得
const todayKey = new Date().toISOString().slice(0, 10)

// ✅ 今日のスケジュールをロード
onMounted(async () => {
  store.loadSchedule(todayKey)

  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
  })

  saveDailyScore()
  loaded.value = true

  // 🔥 ページ遷移後の初回チェック
  await nextTick()
  if (progressRate.value === 100 && !balloonsLaunched.value) {
    balloonsLaunched.value = true
    launchBalloonAnimation({
      count: 14,
      baseSize: 90,
      randomSize: true,
      sway: true
    })
  }
})


// 達成率の計算
const progressRate = computed(() => {
  const total = store.schedule.length
  const done = store.schedule.filter(a => a.completed).length
  return total > 0 ? Math.round((done / total) * 100) : 0
})


// 100%になったら風船アニメーションを開始
//progressRate === 100 になったら 次の DOM 更新後 に Canvas を参照して風船を起動
watch(progressRate, async (newRate) => {
  if (newRate === 100 && !balloonsLaunched.value) {
    balloonsLaunched.value = true
    await nextTick()

    launchBalloonAnimation({
      count: 14,
      baseSize: 90,
      randomSize: true,
      sway: true
    })
        // ★ perfect 専用アニメーションを発火
        triggerPerfectAnimation()
  }
})

// mood & messageKey
// mood＝画像
const mood = computed(() => {
  if (progressRate.value === 100) return 'happy'
  if (progressRate.value >= 80) return 'wink'
  if (progressRate.value >= 50) return 'normal'
  return 'sad'
})
// messageKey＝特別メッセージ
const messageKey = computed(() => {
  if (progressRate.value === 100) return 'happy'
  if (progressRate.value >= 80) return 'good'
  if (progressRate.value >= 50) return 'normal'
  return 'low'
})

function triggerPerfectAnimation() {
  //アバターのアニメーションの発火
  perfectAnimation.value = true;
  setTimeout(() => {
    perfectAnimation.value = false;
  }, 5000);
}



// 当日のスコアを habitScores に保存
function saveDailyScore() {
  const total = store.schedule.length
  const done = store.schedule.filter(a => a.completed).length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  const history = JSON.parse(localStorage.getItem('habitScores') || '{}')
  history[todayKey] = rate
  localStorage.setItem('habitScores', JSON.stringify(history))
  console.log(`📊 habitScores saved for ${todayKey}: ${rate}%`)
}

// 1週間データページへ遷移
function goToWeekData() {
  router.push('/WeekData')
}
// トップに戻る
function goBack() {
  router.push('/')
}
</script>


<style scoped>
.result-view {
  padding: 2rem;
  text-align: center;
}

.score-text {
  font-size: 1.3rem;
  margin-top: 1rem;
  color: #d6e0ff;
}

.score {
  font-size: 2.4rem;
  font-weight: bold;
  color: #7cf4b4;
  text-shadow: 0 0 10px #3ad197;
}

.result-message p {
  margin-top: 1rem;
  color: #bcd0f0;
  font-size: 1.1rem;
}

.button-area {
  margin-top: 2rem;
}

.btn-week {
  background: linear-gradient(135deg, #5a72ff, #7cf4b4);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}

.btn-week:hover {
  opacity: 0.9;
}
/* 吹き出しコメントをアバターの上に重ねる */
/* OpeningAnimation.vue のスタイル（修正案） */

.avatar-message-wrapper {
  position: relative;
  display: flex;
  justify-content: center; /* アバターを中央寄せ */
  align-items: center; /* 垂直方向も中央に */
  min-height: 100px; /* アバターと吹き出しのための最低限の高さを確保 */
}


.reaction-front {

  /* 位置調整を相対的に行う */
  position: absolute; 
  left: 55%; /* 🔥 アバターの右側に配置するための調整 */
  top: 50%; /* 🔥 垂直方向の調整 */
  transform: translate(-50%, -50%); /* 中央寄せ */
  z-index: 999;
  color: #000;
    /* 🔥 サイズ調整 */
  font-size: 1rem; /*文字サイズアップ */

}

.back-btn {
  margin-top: 1.5rem;     /* 上に余白 */
  margin-bottom: 0.5rem;  /* 下にも少し余白 */
  padding: 0.7rem 1.4rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.perfect {
  animation: jump-shiny 1.2s ease-out;
}

</style>
