<!-- Todo リスト用コンポーネントでは、保存済みスケジュールを loadSchedule(dateKey) で呼び出す-->
<!-- 保存したスケジュールを store.loadSchedule(todayKey) でロード-->
<!-- その日作成したリストをここで表示 Todoリスト（完了⇄未完了）-->
<!--完了ボタン押下でスコア集計＋未完了タスクがあれば確認ダイアログ-->

        <template>
           <CardLayout>
          <div class="galaxy-card schedule-preview view-mode">
            <h3 class="text-glow">本日のスケジュール（Todoリスト）</h3>
              <div v-if="store.schedule.length">
              <!--<button @click="testNotification">通知テスト</button>-->
              <!-- Todoコピー/ダウンロードボタン -->
              
              <button class="btn-copy" @click="copyTodo">コピー</button>

                  <div
                   v-for="(element, index) in store.schedule"
                   :key="element.id"
                   :class="['task-row', { completed: element.completed, 'glow': element.isGlowing }]"
                    >
        
                   <div class="activity-left"
                   :class="{ completed: element.completed }"
                   @click="toggleComplete(index)"
                  >
            <!-- FontAwesomeアイコン：完了状態で切り替え -->
            <i
            :class="element.completed ? 'fa-solid fa-circle' : 'fa-regular fa-circle'"
            class="todo-icon"
            ></i>

            <!-- アクティビティ名と時間 -->
            <span class="activity-name">{{ element.activity }}</span>
            <span class="activity-time-text">{{ element.start }}〜{{ element.end }}</span>
            </div>

</div>



            <!-- 完了ボタン -->

            <button class="btn-outline btn" @click="finishTodos">
            完了
          </button>


</div>

  
        <div v-else>
      <p>今日のスケジュールはまだ保存されていません。</p>
    </div>
  </div>
</CardLayout>
</template>
  
<script setup>
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRouter } from 'vue-router'


const store = useScheduleStore()
const router = useRouter()

// 通知関連

let reminderCheckTimer = null

// クリップボードにコピー
function copyTodo() {
  const text = store.schedule
    .map(item => `${item.activity}\n${item.start}〜${item.end}`)
    .join("\n");

  navigator.clipboard.writeText(text)
    .then(() => alert("コピーしました！"))
    .catch(() => alert("コピーできませんでした。"));
}


// -----------------
// タスク完了切り替え
// -----------------
function toggleComplete(index) {
  const item = store.schedule[index]
  if (!item) return
  item.completed = !item.completed
  store.saveSchedule()
  item.isGlowing = true
  setTimeout(() => { item.isGlowing = false }, 800)
}

// -----------------
// 完了ボタン処理
// -----------------
function finishTodos() {
  if (!store.schedule || !store.schedule.length) return
  const incomplete = store.schedule.filter(i => !i.completed)
  if (incomplete.length > 0) {
    const proceed = confirm(`まだ未完了のタスクが ${incomplete.length} 件あります。\nこのまま終了してよろしいですか？`)
    if (!proceed) return
  }

  store.schedule.forEach(i => { if (i.completed) i.isGlowing = true })
 

  const completedCount = store.schedule.filter(i => i.completed).length
  const rate = Math.round((completedCount / store.schedule.length) * 100)

  setTimeout(() => {
    store.schedule.forEach(i => { i.isGlowing = false })
    router.push({ name: 'ResultView', params: { progressRate: rate } })
  }, 2000)
}

</script>



<style scoped>

.todo-icon {
  margin-right: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 1;
}

/* 未完了（空白アイコン） */
.fa-regular.fa-circle {
  color: #ccd6f6; /* 明るめの青白系に変更 */
}

/* 完了済タスク　打ち消し線 */
.completed .activity-name {
    text-decoration: line-through;
    text-decoration-color: #ff7cf4; /* 目立つ色を指定 */
    text-decoration-thickness: 2px;  /* 太めにする */
    color: #ccc; /* 薄めの文字色 */
}

.completed .activity-time-text {
  opacity: 0.5;
}

.completed .todo-icon {
  color: #7cf4b4; /* 完了アイコンの色 */
}


/* 完了（塗りつぶしアイコン） */
.fa-solid.fa-circle {
  color: #7cf4b4; /* ミントグリーンなど視認性の高い色 */
}

.schedule-detail li {
  color: #f0f8ff; /* 明るめにすると背景に映える */
}


.activity-left {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  z-index: 1;
}
.activity-name {
  font-weight: 600;
  color: #f5f5f5;
}
.activity-time-text {
  opacity: 0.8;
}
/* タスク行のラッパー */
.task-row {
  margin-bottom: 0.3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;
  position: relative;
  overflow: hidden;
}


/* タスククリック時の光アニメーション */
.task-row.glow::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
  animation: glowAnim 0.8s ease-out;
  pointer-events: none;
  z-index: 0;
}

@keyframes glowAnim {
  0% { transform: scale(0.2); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

</style>
  