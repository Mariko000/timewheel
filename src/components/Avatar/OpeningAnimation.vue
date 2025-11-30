 <!-- アニメ演出（星空＋挨拶 ＋MotionAvater.vue の呼び出し）-->

 <template>

  <!-- 基本の宇宙背景：galaxy-card -->
  <div class="opening-animation galaxy-card">


    <!-- 時間帯ごとのカラーオーバーレイ（透明度あり） -->
    <div :class="['opening-bg', backgroundClass]"></div>


    <!-- 夜限定 流星層 -->
    <div v-if="isNight" class="shooting-stars"></div>

    <!-- 星雲層 -->
    <div class="nebula"></div>

    <!-- 星層 -->
    <!-- 夜明けは星がうっすら残り、昼は見えなくなくする-->
    <div class="starfield" :style="{ opacity: isMorning ? 0.3 : 0.9 }"></div>

    <!-- ☁️ 朝〜昼限定のふわっと雲 -->
<div
  v-if="isMorning || backgroundClass === 'day-bright'"
  class="cloud-layer"
>
  <div class="cloud cloud1"></div>
  <div class="cloud cloud2"></div>
  <div class="cloud cloud3"></div>
</div>




    <!-- 中央コンテンツ -->
    <div v-if="showContent" class="content fade-in">
      <MotionAvatar />
      <!-- greeting は timeComment （時間帯によって切り替え）-->
       <p class="greeting">{{ timeComment }}</p>
    </div>

     <!-- 時間 -->
    <div class="fixed-time-display">
      {{ currentTime }}
    </div>

<!-- TimeWheel ロゴ演出 -->
<div v-if="showLogo" class="timewheel-logo">
  <h1 class="title">TimeWheel</h1>
</div>

    <!-- 次の画面へ進む -->
    <button
     class="next-button btn-neon"
    @click="goToSetup"
     >
      はじめる
    </button>

   
        <button class="btn-outline" @click="goToWeekData">1週間の推移を見る</button>


        <!--  開発テスト用メニュー 
        <div v-if="devMode" class="test-controls">
        <label>テスト時刻帯を選択：</label>
        <select v-model="selectedTime" @change="updateTestHour">
          <option value="6">早朝（5〜8時）</option>
          <option value="10">朝（9〜16時）</option>
          <option value="18">夕方（17〜19時）</option>
          <option value="22">夜（20〜23時）</option>
          <option value="2">深夜（0〜4時）</option>
        </select>
      </div>-->

  </div>

</template>


<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import MotionAvatar from "@/components/Avatar/MotionAvatar.vue"

// 開発モード切り替え
const devMode = true

// ルーターを取得
const router = useRouter()

// 表示できるか、するとしたらいつなのか確認要！
const currentMessage = ref("🌅 起動中...");

// ロゴ演出用の状態管理
const showLogo = ref(true)
const showContent = ref(false)
const showButton = ref(false)


// ✅ 1. 現在時刻表示用の変数を追加し、更新処理を実装


const currentTime = ref(''); // 現在時刻を保持するリアクティブ変数
let timerId; // setIntervalのIDを保持する変数

// 時刻をフォーマットする関数 (HH:mm:ss形式)
function updateCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  // HH:mm 形式
  currentTime.value = `${hours}:${minutes}`;
}

onMounted(() => {
  // 初回表示
  updateCurrentTime();
  // 1秒ごとに時刻を更新
  timerId = setInterval(updateCurrentTime, 1000);
  // ① ロゴを2秒表示して消す
  setTimeout(() => {
    showLogo.value = false
    // ② アバター＆挨拶を表示
    showContent.value = true

    // ③ さらに1秒後にボタンを表示
    setTimeout(() => {
      showButton.value = true
    }, 1000)
  }, 2000)
})

// コンポーネントが破棄されるときにタイマーを解除（メモリリーク防止）
onUnmounted(() => {
  clearInterval(timerId);
});

// 時間帯ごとのメッセージ
const messages = {
  morning: "新しい一日を始めよう。",
  day: "今日の時間を大切に使おう。",
  evening: "一日をゆるやかに締めくくろう。",
  night: "穏やかな夜を過ごしてね。",
  midnight: "静かな時間が流れています。"
}
const greeting = ref("おはよう！今日はどんな1日にする？")

//現在の時刻を取得　現在時刻を ref で保持（リアクティブにする）
const hour = ref(new Date().getHours())

// 開発用に手動選択：テスト時間選択
const selectedTime = ref(hour.value)

const backgroundClass = computed(() => {
  if (hour.value >= 5 && hour.value < 9) return "morning-dawn"
  if (hour.value >= 9 && hour.value < 17) return "day-bright"
  if (hour.value >= 17 && hour.value < 20) return "bg-evening"
  if (hour.value >= 20 && hour.value < 24) return "bg-night"
  return "bg-midnight"
})


// ☀️ 特殊エフェクト切替（isMorningが雲？isNightが流星？）
const isMorning = computed(() => hour.value >= 5 && hour.value < 9)
const isNight = computed(() => hour.value >= 20 || hour.value < 5)

const timeComment = ref("")

// コメント更新処理
function updateComment() {
  if (hour.value >= 5 && hour.value < 9) timeComment.value = messages.morning
  else if (hour.value >= 9 && hour.value < 17) timeComment.value = messages.day
  else if (hour.value >= 17 && hour.value < 20) timeComment.value = messages.evening
  else if (hour.value >= 20 && hour.value < 24) timeComment.value = messages.night
  else timeComment.value = messages.midnight
}

updateComment()

// テスト用：手動で時間変更
function updateTestHour() {
  hour.value = Number(selectedTime.value)  // hour を更新
  updateComment()                         // コメント更新
  console.log(hour.value, backgroundClass.value, isMorning.value, isNight.value)
}

// TimeSetup.vue へ遷移する関数
function goToSetup() {
  router.push({ name: "TimeSetup" });
}

// 本番ではリアルタイム更新（1分ごとに再評価）
// if (!devMode) {
  // setInterval(() => {
  //   hour.value = new Date().getHours()
  //   updateComment()
  // }, 60000)
// }

// onMounted(() => {
  // ★ 演出確認中につき、遷移は停止中
  /*
  const router = useRouter()
  setTimeout(() => {
    document.querySelector(".opening-animation").classList.add("fade-out")
    setTimeout(() => router.push("/TimeSetup"), 1500)
  }, 5000)
  */
// })

// 1週間データページへ遷移
function goToWeekData() {
  router.push('/WeekData')
}
</script>

<style scoped>

.test-controls {
  position: relative; /* 上に出すため */
  z-index: 20;        /* 星や背景より上 */
}
/*時刻（固定） */
.fixed-time-display {
  margin-bottom: 2rem; /* ロゴとの間隔 */

  font-family: 'Orbitron', 'Zen Dots', sans-serif;
  /* 視認性確保のための色 */
  color: #FFFFFF; /* 🔥 文字自体を白色にする (最も明るい色) */
  
  /* 視認性とネオン効果を両立するシャドウ */
  text-shadow: 
    /* 1. 白い影で文字をくっきり太く見せる */
    0 0 4px #FFFFFF,
    
    /* 2. 外側に広がるネオンの光を、背景に合う青/マゼンタで強化 */
    0 0 10px #00ffff,    /* シアンの光 */
    0 0 20px #ff00ff,    /* マゼンタの光 */
    0 0 30px #00ffff;    /* 広いシアンの光 */

  font-size: 2rem; /* サイズをさらに大きくする */
  font-weight: bold;
}
/*Opening Animation */

/* TimeWheel ロゴ */
.timewheel-logo {
  position: relative; /* absolute → relative に変更 */
  margin-top: 2rem;  /* 上下にスペースを追加 */
  text-align: center;
  z-index: 1; /* 必要に応じて調整 */
}

.timewheel-logo .title {
  font-family: 'Baloo 2', sans-serif;
  padding: 10px;
  font-size: 3rem;
  letter-spacing: 0.1em;
  background: linear-gradient(90deg, #FF9900, #FFD700, #FFFFFF); /* 鮮やかなオレンジから白へ */
  /* 2. 縁取り（text-shadow）を強化 */
  /* 強めの黒い縁取りを加えて、どんな背景でも浮き立たせる */
  text-shadow: 
    -2px -2px 0 #f83e00,
     2px -2px 0 #0a01c3,

    0 0 10px rgba(255, 165, 0, 0.8), /* 内側に光るグロー効果（オレンジ） */
    0 0 20px rgba(255, 215, 0, 0.5); /* さらに広がるグロー効果 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: scale(0.95); }
  20% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.05); }
}

.fade-in {
  animation: fadeIn 1s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.opening-animation {
  position: relative;
  max-width: 420px;
  width: 100%;
  margin: 2rem auto;
  padding: 2.6rem 1.6rem 2rem;
  border-radius: 1.5rem;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: radial-gradient(circle at center, #060a1a 0%, #01020a 100%);
  transition: opacity 1.5s ease;
}

.opening-animation.fade-out {
  opacity: 0;
}
/* タブレット対応（768px以下） */
@media (max-width: 768px) {
  .opening-animation {
    max-width: 90%;        /* 画面にフィットさせる */
    padding: 2rem 1.2rem 1.6rem;
    border-radius: 1.2rem;
  }
}

/* スマホ対応（480px以下） */
@media (max-width: 480px) {
  .opening-animation {
    max-width: 95%;
    padding: 1.6rem 1rem 1.2rem;
    border-radius: 1rem;
  }
}
/* 時間帯のカラーオーバーレイ */
.opening-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  animation: gradientFlow 60s ease-in-out infinite alternate;
  opacity: 0.8;
  transition: opacity 1s ease;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}


/* 早朝（5〜8時） 夜明け前の静かな光 */
.morning-dawn {
  background: linear-gradient(to top, #fbce8f 0%, #B0D0FF 60%, #7BAAF7 100%);
  background-blend-mode: lighten;
  background-size: cover;
  opacity: 0.85;
  animation: dawnFlow 90s ease-in-out infinite alternate;
}

@keyframes dawnFlow {
  0% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(20deg) brightness(1.1); }
  100% { filter: hue-rotate(-10deg) brightness(1); }
}

/* 朝（9〜16時） 明るい昼の光 */
.day-bright {
  background: radial-gradient(circle at 50% 20%, #03b7f8 0%, #A1C4FD 100%);
  background-blend-mode: screen;
  background-size: cover;
  opacity: 0.9;
  animation: dayGlow 80s ease-in-out infinite alternate;
}

@keyframes dayGlow {
  0% { filter: brightness(1) contrast(1); }
  50% { filter: brightness(1.1) contrast(1.05); }
  100% { filter: brightness(1) contrast(1); }
}



/* 夕方（17〜19時） 夕焼け空風 */
.bg-evening {
  background: linear-gradient(
    to top,
    rgba(255, 120, 80, 0.9) 0%,     /* 下：濃いオレンジ */
    rgba(255, 190, 120, 0.8) 35%,   /* 中間：夕焼けの明るい層 */
    rgba(255, 230, 200, 0.6) 60%,   /* 上：白オレンジの光 */
    rgba(255, 255, 255, 0.4) 100%   /* 最上部：白っぽく霞む */
  );
  background-size: 200% 200%;
  animation: sunsetGlow 90s ease-in-out infinite alternate;
  opacity: 0.9;
  transition: all 1.5s ease;
}

@keyframes sunsetGlow {
  0% {
    filter: brightness(1) contrast(1);
    background-position: 0% 50%;
  }
  50% {
    filter: brightness(1.1) contrast(1.05);
    background-position: 100% 50%;
  }
  100% {
    filter: brightness(1) contrast(1);
    background-position: 0% 50%;
  }
}

/* 夜 */
.bg-night {
  background: transparent;
}

/* 深夜 */
.bg-midnight {
  background: rgba(0, 5, 20, 0.3);
}

/* 朝限定 光の筋（静かに揺れる） */
.light-rays {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 200, 0.08) 0%,
    rgba(255, 255, 255, 0.15) 2%,
    transparent 4%
  );
  background-size: 200% 200%;
  animation: lightWave 20s linear infinite;
  z-index: 2;
}

@keyframes lightWave {
  from { background-position: 0 0; }
  to { background-position: 100% 100%; }
}


/*  星層*/
.starfield {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-image:
    /* 第一層 */
    radial-gradient(1px 1px at 10% 20%, white, transparent),
    radial-gradient(1px 1px at 25% 80%, #a3e7fc, transparent),
    radial-gradient(1.5px 1.5px at 50% 50%, #c084fc, transparent),
    radial-gradient(2px 2px at 70% 10%, #93c5fd, transparent),
    radial-gradient(1px 1px at 90% 90%, white, transparent),
    radial-gradient(1px 1px at 15% 60%, #b3b3ff, transparent),
    radial-gradient(1px 1px at 80% 40%, #fff, transparent),

    /* 第二層 */
    radial-gradient(1px 1px at 40% 10%, #b3d8ff, transparent),
    radial-gradient(1.2px 1.2px at 60% 75%, #e5e5ff, transparent),
    radial-gradient(1.5px 1.5px at 85% 30%, #c084fc, transparent),
    radial-gradient(1px 1px at 5% 90%, #fff, transparent),
    radial-gradient(2px 2px at 30% 45%, #a5f3fc, transparent);
  background-repeat: no-repeat;
  animation: twinkle 5s infinite ease-in-out alternate;
  opacity: 0.9;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))
          drop-shadow(0 0 8px rgba(100, 180, 255, 0.4));
}

@keyframes twinkle {
  0%   { opacity: 0.4; transform: scale(1);   filter: brightness(1); }
  50%  { opacity: 1;   transform: scale(1.05); filter: brightness(1.6); }
  100% { opacity: 0.6; transform: scale(1);   filter: brightness(1.2); }
}

/* 星雲（光の霞）層*/
.nebula {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  z-index: 0;
  background: radial-gradient(circle at 40% 60%, rgba(160, 100, 255, 0.2), transparent 70%),
              radial-gradient(circle at 70% 30%, rgba(60, 200, 255, 0.15), transparent 70%),
              radial-gradient(circle at 20% 40%, rgba(255, 180, 255, 0.12), transparent 70%);
  animation: floatNebula 80s linear infinite alternate;
  filter: blur(100px);
}
@keyframes floatNebula {
  0% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.1) translate(20px, -20px); }
  100% { transform: scale(1) translate(-10px, 10px); }
}


/*  流星アニメーション（夜のみ） */
.shooting-stars {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 3;
}

.shooting-stars::before,
.shooting-stars::after {
  content: "";
  position: absolute;
  top: -10%;
  left: 50%;
  width: 2px;
  height: 80px;
  background: linear-gradient(45deg, white, transparent);
  animation: shooting 4s ease-in-out infinite;
  opacity: 0.8;
}

.shooting-stars::after {
  left: 70%;
  animation-delay: 3s;
}

@keyframes shooting {
  0% { transform: translate(0, 0) rotate(45deg); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translate(-300px, 300px) rotate(45deg); opacity: 0; }
  100% { opacity: 0; }
}




/* コンテンツ（アバター＋挨拶） */
.content {
  position: relative;
  z-index: 10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.greeting {
  color: #fff;
  font-size: 1.6rem;
  margin-top: 1.2rem;
  letter-spacing: 0.05em;
  animation: fadeInText 3s ease;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

.next-button {
  margin-top: 2rem;
  z-index: 30; /* ← 背景より前に出して背景のオーバーレイをピンポイントで無効に */
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 9999px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: 0.3s;
}

.next-button:hover {
  background-color: #2563eb;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInText {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
