<!-- Todo リスト用コンポーネントでは、保存済みスケジュールを loadSchedule(dateKey) で呼び出す-->
<!-- 保存したスケジュールを store.loadSchedule(todayKey) でロード-->
<!-- その日作成したリストをここで表示 Todoリスト（完了⇄未完了）-->
<!--完了ボタン押下でスコア集計＋未完了タスクがあれば確認ダイアログ-->

        <template>
           <CardLayout>
          <div class="galaxy-card schedule-preview view-mode">
            <h3 class="text-glow">本日のスケジュール（Todoリスト）</h3>

                   <!-- 各タスクの完了済を「見た目上」消す（非表示）-->

                   <div v-if="store.schedule.length">
                    <button @click="sendNotification('テスト通知です')">通知テスト</button>


  <!-- リマインダーの時間選択 -->
<!-- 全体通知設定（代表 select） -->
<div class="global-reminder">
  <label>通知設定:</label>
  <select v-model="store.globalReminderOffset" @change="applyGlobalReminder">
    <option value="none">通知しない</option>
    <option value="0">時間ちょうど</option>
    <option value="5">5分前</option>
    <option value="10">10分前</option>
    <option value="15">15分前</option>
  </select>
</div>
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
import { onMounted, onUnmounted } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRouter } from 'vue-router'

const store = useScheduleStore()
const router = useRouter()

// 通知
let reminderCheckTimer = null

// ------------------------------
// 📌 フォアグラウンド通知テスト用
// ------------------------------
function sendNotification(message = "🔔 通知テスト") {
  if (!("Notification" in window)) {
    console.log("❌ このブラウザは通知未対応");
    return;
  }

  // すでに許可されている場合
  if (Notification.permission === "granted") {
    new Notification("TimeWheel 通知", {
      body: message,
      icon: "/icons/icon-192x192.png"
    });
    return;
  }

  // 許可をまだ求めていない場合
  if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      console.log("通知許可:", permission);
      if (permission === "granted") {
        new Notification("🎉 通知がオンになりました！", {
          body: "今後ここに通知が届きます。",
        });
      }
    });
  }
}


// 時刻計算関数
function subtractMinutes(timeStr, minutes) {
  // "HH:MM" -> Date 型に変換
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date()
  d.setHours(h)
  d.setMinutes(m - minutes)
  const hh = String(d.getHours()).padStart(2,"0")
  const mm = String(d.getMinutes()).padStart(2,"0")
  return `${hh}:${mm}`
}


//一度だけ許可ダイアログ
onMounted(() => {
  if (Notification.permission === "default") {
    Notification.requestPermission().then(result => {
      console.log("通知許可:", result)
    })
  }
})

onMounted(() => {
  const todayKey = new Date().toISOString().slice(0, 10)
  store.loadSchedule(todayKey)

  if (!Array.isArray(store.schedule)) {
    store.schedule = []
  }

  store.schedule.forEach(item => {
    if (item.completed === undefined) item.completed = false
    item.isGlowing = false
    if (item.reminderOffset === undefined) {
      item.reminderOffset = store.globalReminderOffset // ← 代表値を初期値に
    }
    if (item.notified === undefined) {
      item.notified = false
    }
  })

  store.saveSchedule(todayKey)
})



// タスククリック時の光アニメーション
function toggleComplete(index) {
  const item = store.schedule[index]
  if (!item) return

  item.completed = !item.completed
  store.saveSchedule()

  // タスク単位の光アニメーション
  item.isGlowing = true
  setTimeout(() => { item.isGlowing = false }, 800)   // 0.8秒で消える
}

onMounted(() => {
  reminderCheckTimer = setInterval(checkReminders, 60 * 1000) // 1分ごと
})
//"none" が数値化されないようにする
function checkReminders() {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);

  store.schedule.forEach(item => {
    if (!item || item.reminderOffset === "none") return;

    const reminderMoment = item._reminderTime ?? subtractMinutes(item.start, Number(item.reminderOffset));

    // ---- 修正ポイント ----
    if (!item.notified && reminderMoment <= current) {
      sendReminder(item);
      item.notified = true;
      store.saveSchedule();
    }
  });
}


//全体通知設定を一括で管理/全タスクに反映させる
function applyGlobalReminder() {
  const offset = store.globalReminderOffset;

  // --- ① 全タスクに新しい通知設定を反映 ---
  store.schedule.forEach(item => {
    item.reminderOffset = offset;
    item.notified = false; // 再通知できるようリセット
  });

  // --- ② 通知なしならここで終了 ---
  if (offset === "none") {
    console.log("⏹ 全通知オフ");
    store.saveSchedule();
    return;
  }

  // --- ③ 時間を計算し直す ---
  store.schedule.forEach(item => {
    if (!item.start) return;

    const reminderMoment = subtractMinutes(item.start, Number(offset));

    // タスクに計算済みの通知時間を保存
    item._reminderTime = reminderMoment;
  });

  store.saveSchedule();

  console.log(`🔔 全タスク通知を "${offset}分前" に再設定しました`);
}


//通知を表示する関数
function sendReminder(task) {
  if (!task) return;
  sendNotification(`${task.activity} の時間です。`);
}

//FinishView を離れたら監視停止

onUnmounted(() => {
  if (reminderCheckTimer) clearInterval(reminderCheckTimer)
})


// 完了ボタン押下時
function finishTodos() {
  if (!store.schedule || !store.schedule.length) return

  // 未完了タスクをチェック
  const incomplete = store.schedule.filter(item => !item.completed)
  let proceed = true

  if (incomplete.length > 0) {
    // 確認ダイアログ
    proceed = confirm(
      `まだ未完了のタスクが ${incomplete.length} 件あります。\nこのまま終了してよろしいですか？`
    )
  }
  if (!proceed) return

  // ゴッドレイ風演出: 完了タスクを光らせる
  store.schedule.forEach(item => {
    if (item.completed) item.isGlowing = true
  })

  // 数百ms後に消す
  setTimeout(() => {
    store.schedule.forEach(item => { item.isGlowing = false })
  }, 1000)

  // 達成率計算
  const completedCount = store.schedule.filter(item => item.completed).length
  const rate = Math.round((completedCount / store.schedule.length) * 100)

     // アニメーション待ってから遷移
  setTimeout(() => {
    // 光アニメーションを消す
    store.schedule.forEach(item => { item.isGlowing = false })

    // ResultView に遷移
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
  