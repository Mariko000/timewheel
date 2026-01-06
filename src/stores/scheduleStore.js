import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue' 
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js'
import { mainActivities } from '@/stores/mainActivities.js'



// Chart.jsのコンポーネント登録（Pieチャート用）
Chart.register(PieController, ArcElement, Tooltip, Legend)



export const useScheduleStore = defineStore('schedule', () => {
  const wakeTime = ref('06:00')
  const sleepTime = ref('23:00')
  const mainActivity = ref('学校')

  const mainActivityStart = ref('08:00')
  const mainActivityEnd = ref('18:00')
  const breakStyle = ref('分散型')
  const commuteTime = ref(normalizeMinutes(30))  // 通勤時間（分）
  const schoolTime = ref(normalizeMinutes(30))  // 通学時間（分）
  const schedule = ref([])
  const activities = ref([])

  const state = ref({})

  function parseFlexibleTime(str) {
    if (!str) return null
    const [h, m] = str.split(":").map(Number)
    if (isNaN(h) || isNaN(m)) return null
    return h * 60 + m
  }

  function formatFlexible(min) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
  }

  function normalizePeriod(startMin, endMin) {
    if (endMin < startMin) endMin += 1440
    return { startMin, endMin }
  }

  
    // アクティビティ プリセット

  const presetActivities = ref([
    { name: '読書', duration: 60 },
    { name: '勉強', duration: 90 },
    { name: 'イラスト', duration: 120 },
    { name: 'お菓子作り', duration: 180 },
    { name: 'ジョギング', duration: 60 },
    { name: 'ギター', duration: 60 },
    { name: 'ガーデニング', duration: 120 },
    { name: 'ゲーム', duration: 120 },
    { name: '映画鑑賞', duration: 120 },
    { name: 'ハンドメイド / 編み物', duration: 90 },
    { name: '筋トレ', duration: 60 },
    { name: 'サイクリング', duration: 90 },
    { name: 'カラオケ / 歌', duration: 60 },
  ])



// 時間変換系
function toMinutes(timeStr) {
  if (!timeStr) return 0 // ← null でも安全
  const [h,m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
function absoluteMinutes(val) {
  let m;

  // 数値（分）で入ってきた場合
  if (typeof val === "number") {
    m = val;
  }
  // "HH:MM" の場合
  else if (typeof val === "string") {
    m = toMinutes(val);
  }
  // それ以外
  else {
    return 0;
  }

  const wake = toMinutes(wakeTime.value);
  return m < wake ? m + 1440 : m;
}

function toTimeString(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

//移動時間は全部 “分の数値” に統一
function normalizeMinutes(val) {
  return typeof val === "string" ? Number(val) : val
}

function getMainActivityBlock() {
  // メイン活動なしなら null 返す
  if (
    mainActivity.value === "なし" ||
    mainActivity.value === "自由" ||
    (mainActivity.value === "カスタム" && (!mainActivityStart.value || !mainActivityEnd.value))
  ) {
    return null
  }

  return {
    start: toMinutes(mainActivityStart.value),
    end: toMinutes(mainActivityEnd.value),
    startTime: mainActivityStart.value,
    endTime: mainActivityEnd.value,
    label: mainActivity.value
  }
}


  function generateSchedule() {
    const startDay = absoluteMinutes(wakeTime.value)
    const endDay = absoluteMinutes(sleepTime.value)
    const mainBlock = getMainActivityBlock()
    const hasMainActivity = !!mainBlock
    const isHoliday = mainActivity.value === '休日'
    let current = startDay
    const acts = activities.value.map(a => ({ ...a }))
    const result = []

    // --- 朝準備 ---
    result.push({ start: toTimeString(current), end: toTimeString(current + 30), activity:"朝の準備" })
    current += 30

    // --- 朝食 ---
    result.push({ start: toTimeString(current), end: toTimeString(current + 30), activity:"朝食" })
    current += 30

    if (isHoliday) {
      fillSlot(result, current, toMinutes("12:00"), acts, "holiday")
      result.push({ start:"12:00", end:"12:15", activity:"昼食準備" })
      result.push({ start:"12:15", end:"13:00", activity:"昼食" })
      fillSlot(result, toMinutes("13:00"), endDay, acts, "holiday")
    } else {

        // 「なし」「カスタム」の場合 → 朝準備/朝食のあとすぐ活動を埋める
        if (mainActivity.value === "なし" || mainActivity.value === "カスタム" || mainActivity.value === "自由") {
  
          const eveningPrep = toMinutes("17:00");
          const dinner = toMinutes("17:15"); // 夕方準備15分
        
          // ① 夕方前の空き時間を埋める
          if (current < eveningPrep) {
            fillSlot(result, current, eveningPrep, acts, "free");
          }
        
          // ② 夕方ルーチンを固定配置
          result.push({
            start: toTimeString(eveningPrep),
            end: toTimeString(eveningPrep + 15),
            activity: "夕方準備"
          });
        
          result.push({
            start: toTimeString(dinner),
            end: toTimeString(dinner + 30),
            activity: "夕食"
          });
        
          current = dinner + 30;
        
          // ③ 夜の残り時間を埋める
          if (current < endDay) {
            fillSlot(result, current, endDay, acts, "evening");
          }
        
          schedule.value = result;
          return;
        }
        
        // 通勤／通学
      let commuteLabel = null
      if (mainActivity.value === "学校") commuteLabel = "通学"
      else if (["早番シフト","日勤帯","夜勤帯①","夜勤帯②"].includes(mainActivity.value)) commuteLabel = "通勤"
      const commuteDur = normalizeMinutes(
        mainActivity.value === "学校" ? schoolTime.value : commuteTime.value
      )

      if (commuteLabel && mainBlock) {
        const mainStartAbs = absoluteMinutes(mainBlock.startTime)
        const mainEndAbs = absoluteMinutes(mainBlock.endTime)
        
        // 行き
        result.push({
          start: toTimeString(mainStartAbs - commuteDur),
          end: toTimeString(mainStartAbs),
          activity: `${commuteLabel}（行き）`
        })

      
        // メイン活動
        result.push({
          start: toTimeString(mainStartAbs),
          end: toTimeString(mainEndAbs),
          activity: mainActivity.value
        })
      
        // 帰り
        result.push({
          start: toTimeString(mainEndAbs),
          end: toTimeString(mainEndAbs + commuteDur),
          activity: `${commuteLabel}（帰り）`
        })
      
        current = mainEndAbs + commuteDur
      }
      
      

      // --- 夜スロット ---
      if (current < endDay) {
        result.push({ start: toTimeString(current), end: toTimeString(current+15), activity:"夕方準備" })
        current += 15
        result.push({ start: toTimeString(current), end: toTimeString(current+30), activity:"夕食" })
        current += 30
        fillSlot(result, current, endDay, acts, "evening")
      }
    }

    // --- duration 計算 & id付与 ---
    schedule.value = result.map(item => ({
      ...item,
      duration: toMinutes(item.end) - toMinutes(item.start),
      id: crypto.randomUUID()
    }))

    // --- 睡眠時間超過チェック ---
    const lastEndAbs = absoluteMinutes(schedule.value[schedule.value.length -1].end)
    const sleepAbs = absoluteMinutes(sleepTime.value)
    if (lastEndAbs > sleepAbs) {
      console.warn("就寝時間を超過しました（副活動も保持）")
    }

    // computed再評価のためコピー
    schedule.value = [...schedule.value]
  }


  // fillSlot も副活動専用に
  function fillSlot(result, startMinute, endMinute, acts, period) {
    if (!endMinute || endMinute <= startMinute || isNaN(endMinute) || isNaN(startMinute)) return

    let current = startMinute

    // 既にスケジュール済みの活動名を除外
    const scheduledNames = new Set(result.map(r => r.activity.replace(/^.+? /,'').trim()))
    const remainingActs = acts.filter(a => !scheduledNames.has(a.name))

    // 朝スロットでは短時間アクティビティをランダムに1つだけ
    if (period === 'morning') {
      const shortActs = remainingActs.filter(a => a.duration <= 60)
      if (shortActs.length) {
        const act = shortActs[Math.floor(Math.random()*shortActs.length)]
        const dur = Math.min(act.duration, endMinute - current)
        result.push({ start: toTimeString(current), end: toTimeString(current + dur), activity: `${act.name}` })
        return
      }
    }

    // 休日・夕方・夜スロット
    const breakDur = breakStyle.value === '分散型' ? 10 : breakStyle.value === 'まとまった長め' ? 20 : 0

    for (const act of remainingActs) {
      const dur = act.duration
      result.push({
        start: toTimeString(current),
        end: toTimeString(current + dur),
        activity: `${act.name}`,
        originalDuration: dur
      })
      current += dur

      if (breakDur > 0) {
        result.push({
          start: toTimeString(current),
          end: toTimeString(current + breakDur),
          activity: '休憩'
        })
        current += breakDur
      }
    }
  }

  // schedule に id を付与するメソッド

  function generateScheduleWithId() {
    generateSchedule()
    const names = schedule.value.map(item => item.activity)
  
    schedule.value = schedule.value.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      duration: toMinutes(item.end) - toMinutes(item.start)
    }))
    schedule.value = [...schedule.value]
  }
  
  
  function recalculateSchedule() {
    if (!schedule.value.length) return;
  
    // 起床時間を基準に現在時刻を初期化
    let [currentHour, currentMin] = wakeTime.value.split(':').map(Number);
  
    schedule.value = schedule.value.map(item => {
      // 元の duration を保持
      const duration = toMinutes(item.end) - toMinutes(item.start);
  
      // 時間を再計算
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      const endTotal = currentHour * 60 + currentMin + duration;
      const endHour = Math.floor(endTotal / 60);
      const endMin = endTotal % 60;
      const end = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  
      // 次の活動用に現在時刻を更新
      currentHour = endHour;
      currentMin = endMin;
  
      return { ...item, start, end };
    });
  
    // computed のための再代入
    schedule.value = [...schedule.value];
  
    // ⬇⬇⬇ ここに追加 ⬇⬇⬇
    saveSchedule();
  }
  



// 追加：睡眠時間オーバーチェック
//活動が就寝時間 (sleepTime) をオーバーした場合
//自動的に短縮してでもスケジュールに入れる
//その状態になったら「睡眠時間を超える活動がありました」などのUIアラートを表示


const oversleepAlert = computed(() => {
  if (!schedule.value.length) return false
  const sleepAbs = absoluteMinutes(sleepTime.value)
  const lastEndAbs = absoluteMinutes(schedule.value[schedule.value.length - 1].end)
  return lastEndAbs > sleepAbs
})


    // =============================
  // 時間更新・再計算ロジック
  // =============================

  /**
   * 指定したスケジュールIDの開始時刻または終了時刻を更新
   * @param {Number} id - スケジュール要素のID
   * @param {String} field - "start" or "end"
   * @param {String} newTime - "HH:MM"形式の新しい時刻
   */
  function updateScheduleTime(id, field, newTime) {
    const index = schedule.value.findIndex(item => item.id === id)
    if (index === -1) return
    schedule.value[index][field] = newTime
    adjustLaterActivities(index)
  }


  /**
   * 変更された活動より後ろのスケジュールをずらす
   * ex) 「勉強」を30分延ばしたら次の「夕食」以降の活動が全て後ろにスライド
   * @param {Number} startIndex - 変更の起点となるスケジュールindex
   */
  function adjustLaterActivities(startIndex) {
    for (let i = startIndex + 1; i < schedule.value.length; i++) {
      const prev = schedule.value[i-1]
      const current = schedule.value[i]
      const prevEndMin = toMinutes(prev.end)
      const duration = toMinutes(current.end) - toMinutes(current.start)
      schedule.value[i].start = toTimeString(prevEndMin)
      schedule.value[i].end = toTimeString(prevEndMin + duration)
    }
    schedule.value = [...schedule.value]
  }




  



  // localStorage 保存・読み込み
  // 今日の日付（YYYY-MM-DD）をキーにして保存

 // 過去の履歴も localStorage に残せるようにする

 // 履歴一覧を取得する関数も追加

 // 必要に応じて日付を指定して読み込み可能


// 保存（日付キー付き）
const scheduleHistory = ref([])

// 今日の日付キーを作る関数（例: 2025-11-12）
//saveSchedule() で日付キーを自動取得させるため


  function formatDateKey(date = new Date()) {
    const y = date.getFullYear()
    const m = String(date.getMonth()+1).padStart(2,'0')
    const d = String(date.getDate()).padStart(2,'0')
    return `${y}-${m}-${d}`
  }

  function saveSchedule(dateKey=formatDateKey()) {
    const data = {
      wakeTime: wakeTime.value,
      sleepTime: sleepTime.value,
      mainActivity: mainActivity.value,
      mainActivityStart: mainActivityStart.value,
      mainActivityEnd: mainActivityEnd.value,
      activities: activities.value,
      schedule: schedule.value
    }
    localStorage.setItem(`scheduleData-${dateKey}`, JSON.stringify(data))

    let history = JSON.parse(localStorage.getItem('scheduleHistory') || '[]')
    if (!history.includes(dateKey)) history.push(dateKey)
    if (history.length > 7) {
      history.sort((a,b)=>a.localeCompare(b))
      while(history.length>7){
        const oldest = history.shift()
        localStorage.removeItem(`scheduleData-${oldest}`)
      }
    }
    localStorage.setItem('scheduleHistory', JSON.stringify(history))
  }

// データをロードする
function loadSchedule(dateKey=new Date().toISOString().slice(0,10)){
  const dataStr = localStorage.getItem(`scheduleData-${dateKey}`)
  if (dataStr){
    const data = JSON.parse(dataStr)
    schedule.value = data.schedule || []
    wakeTime.value = data.wakeTime || wakeTime.value
    sleepTime.value = data.sleepTime || sleepTime.value
    mainActivity.value = data.mainActivity || mainActivity.value
    mainActivityStart.value = data.mainActivityStart || mainActivityStart.value
    mainActivityEnd.value = data.mainActivityEnd || mainActivityEnd.value
    activities.value = data.activities || activities.value
  } else {
    schedule.value = []
  }
}

  

  // =============================
  // Setter系
  // =============================
  function setTimeSetup(data) {
    wakeTime.value = data.wakeTime
    sleepTime.value = data.sleepTime
    mainActivity.value = data.mainActivity
    mainActivityStart.value = data.mainActivityStart || mainActivityStart.value
    mainActivityEnd.value = data.mainActivityEnd || mainActivityEnd.value
  }

  // アクティビティ追加
  function addActivity(activity) {
    activities.value.push(activity)
    schedule.value = [...schedule.value]
  }

  function setActivities(newActs) {
    activities.value = Array.isArray(newActs) ? newActs.map(a => ({ ...a })) : []
  }
 

  // activities にも id を付与するメソッド

  function setActivitiesWithId(newActs) {
    activities.value = Array.isArray(newActs) 
      ? newActs.map((a, index) => ({ id: index + 1, ...a }))
      : []
  }    

   //個別削除 id ベースでSchedulePreview.vue から removeSlot(item.id) を渡すだけでOK
   function removeSlot(id) {
    const index = schedule.value.findIndex(item=>item.id===id)
    if (index!==-1) {
      schedule.value.splice(index,1)
      compactScheduleTimes()
      saveSchedule()
    }
  }
  

  //削除後、上から順番に時刻を詰め直し
  function compactScheduleTimes() {
    if (!schedule.value.length) return
    let [currentHour, currentMin] = wakeTime.value.split(':').map(Number)
  
    schedule.value = schedule.value.map(item => {
      const duration = toMinutes(item.end) - toMinutes(item.start)
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      const endTotal = currentHour * 60 + currentMin + duration
      const endHour = Math.floor(endTotal / 60)
      const endMin = endTotal % 60
      const end = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
  
      currentHour = endHour
      currentMin = endMin
  
      return { ...item, start, end }
    })
  
    schedule.value = [...schedule.value]
  }

  
    // 既存の resetAll を確実にリセットする（デバッグ用にもログ）

    function resetAll() {
      wakeTime.value = '06:00'
      sleepTime.value = '23:00'
      mainActivity.value = '学校'
      mainActivityStart.value = '08:00'
      mainActivityEnd.value = '18:00'
      activities.value = []
      schedule.value = []
      localStorage.removeItem('scheduleData')
      console.log('🧹 schedule reset complete')
    }
    
    // ===== 🧯互換用: 古いコードで呼ばれても落ちない =====
function setSchedule(data) {
  console.warn("⚠️ Deprecated function 'setSchedule' was called.", data)

  if (Array.isArray(data)) {
    schedule.value = data.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      duration: toMinutes(item.end) - toMinutes(item.start)
    }))
  } else {
    console.warn("⚠️ setSchedule expected array but received:", data)
  }

  schedule.value = [...schedule.value] // reactivity refresh
}


  return {
    setActivities,
    wakeTime, sleepTime,
    parseFlexibleTime,
    formatFlexible,
    normalizePeriod, absoluteMinutes,mainActivity,
    mainActivityStart, mainActivityEnd,
    activities, presetActivities, schedule,
    commuteTime, schoolTime,
    setTimeSetup, addActivity, resetAll,
    generateSchedule, generateScheduleWithId, setActivitiesWithId,
    updateScheduleTime, adjustLaterActivities, saveSchedule,
    toMinutes, toTimeString, breakStyle,
    removeSlot, oversleepAlert,
    loadSchedule,
    scheduleHistory,
    setSchedule,
    recalculateSchedule
  }

});
