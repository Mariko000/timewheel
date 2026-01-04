<template>
   <CardLayout>
  <div class="galaxy-card activity-input">
    <h3 class="text-primary text-glow">今日やることを選択 / 入力</h3>

    <!-- プリセットタグ一覧 -->
    <div class="preset-tags flex flex-row flex-wrap gap-2 justify-between">
      <span
        v-for="(preset, index) in filteredPresets"
        :key="index"
        class="tag btn-outline"
        @click="toggleActivity(preset)"
        :class="{ selected: isSelected(preset.name) }"
      >
        {{ preset.icon }} {{ preset.name }}
      </span>
    </div>

    <!-- 手動入力 -->
    <div class="manual-input flex flex-row gap-2 items-center">
      <input
        v-model="newActivity"
        type="text"
        placeholder="＋ 新しい活動を入力"
      />
    </div>
      <button class="btn-neon" @click="addCustomActivity">追加</button>
    

    <!-- 選択中の活動 -->
    <div class="selected-list" v-if="store.activities.length">
      <h4 class="text-glow">選択中の活動：</h4>
      <ul>
        <li v-for="(act, i) in store.activities" :key="i" class="flex flex-col gap-2">
          <div class="activity-item flex flex-row justify-between items-center">
            <span>{{ act.name }}</span>
            <span class="duration text-dim">⏱ {{ act.duration }}分</span>
            <button 
            @click="removeSelectedActivity(i)" 
            class="btn-delete"
            title="削除"
          >
            ✕
          </button>
          </div>

          <!-- スライダーで変更 -->
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            v-model.number="act.duration"
            @input="updateDuration(i, act.duration)"
          />
        </li>
      </ul>
    </div>

    <!-- 保存ボタン -->
    <button @click="saveAndReturn" class="btn-neon" id="save">
      スケジュールに反映して次へ
    </button>

    <!-- アバター固定エリア -->
    <div class="avatar-fixed-wrapper" aria-hidden="false">
      <ReactiveAvatar :mood="avatarMood" :message="avatarMessage" />
    </div>

    <!-- ローディング -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loader"></div>
        <p class="text-glow">スケジュールを生成しています...</p>
      </div>
    </transition>
  </div>
</CardLayout>
</template>


<script setup>
import { ref, onMounted, computed, watch,  nextTick, inject  } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRouter } from 'vue-router'





const router = useRouter()
const store = useScheduleStore()
const newActivity = ref('')

// チュートリアル
import { getActivityInputSteps } from '@/composables/useTutorialSteps'
import { isTutorialDone, markTutorialDoneFor } from '@/components/Tutorial/tutorialProgress'

// App.vue から注入
const tutorial = inject('tutorial')
const isFirstTutorial = inject('isFirstTutorial', ref(false))

watch(
  isFirstTutorial,
  async (val) => {
    if (!val) return
    if (!tutorial) return
    if (isTutorialDone('activityInput')) return

    console.log('ActivityInput: チュートリアル開始')

    await nextTick()

    tutorial.start(getActivityInputSteps(), {
      onFinish: () => {
        markTutorialDoneFor('activityInput')
      }
    })
  },
  { immediate: true }
)

// onMounted(() => {
  // // 3. 判定が true の場合のみ開始する
 //  if (isFirstTutorial) {
  // tutorial.start(getActivityInputSteps())
// }
// })


//リアクション用の ref と watch を定義
const avatarMood = ref("normal")
const avatarMessage = ref('今日は何をする？') // ✅ 初期メッセージ
import ReactiveAvatar from "@/components/Avatar/ReactiveAvatar.vue";

const userDidSave = ref(false);

onMounted(() => {
  const preloadImages = ["normal3.png", "happy.png", "sad.png", "thinking.png", "wink.png"];
  preloadImages.forEach(file => {
    const img = new Image();
    img.src = new URL(`@/assets/avatar/${file}`, import.meta.url).href;
  });
});


let reactionTimer = null // ← タイマー管理

//ローディング制御用
const isLoading = ref(false);

// ✅ マウント時に store の既存データを反映
onMounted(() => {
  if (!store.activities || !Array.isArray(store.activities)) {
    store.setActivities([]) // storeにsetter追加想定
  }
})

// すでに選択されているか確認
function isSelected(name) {
  return store.activities.some(a => a.name === name)
}



  // 通学か通勤のどちらか一方のみ表示 され、ユーザーが時間を設定できる
const filteredPresets = computed(() => {
  // メイン活動に応じて通勤 or 通学を表示
  const main = store.mainActivity
  return store.presetActivities.filter(p => {
    if (main === '学校') {
      // 学校なら通学のみ
      if (p.name === '通勤') return false
      return true
    } else if (['仕事','早番シフト','日勤帯','夜勤帯①','夜勤帯②'].includes(main)) {
      // 仕事なら通勤のみ
      if (p.name === '通学') return false
      return true
    }
    return true
  })
})
// --- アバターリアクションロジック ---
// --- リアクションを1つずつ1秒おきに切り替える（アニメーションみたいなAIぽい機能）---
//  watchでstore.activitiesを監視してリアクションを更新

// --- Activity監視 ---

// 通勤／通学は ActivityInput.vue では単一オブジェクトとして扱う
//それ以外の活動は通常通り toggle, 関数の中で条件分岐を入れている
// プリセットの追加・削除（通勤／通学を単一オブジェクトとして扱う）
function toggleActivity(preset) {
  const commuteNames = ['通勤', '通学']  // 行き／帰りではなく単体名
  const isCommute = commuteNames.includes(preset.name)

  if (isCommute) {
    // 通勤／通学は1つだけに制限
    const existingIndex = store.activities.findIndex(a => commuteNames.includes(a.name))
    if (existingIndex !== -1) {
      // 同じ種類なら削除、違う種類なら置き換え
      if (store.activities[existingIndex].name === preset.name) {
        store.activities.splice(existingIndex, 1)
      } else {
        store.activities.splice(existingIndex, 1, { ...preset })
      }
    } else {
      store.activities.push({ ...preset })
    }
  } else {
    // 通勤／通学以外は通常のtoggle
    const index = store.activities.findIndex(a => a.name === preset.name)
    if (index !== -1) {
      store.activities.splice(index, 1)
    } else {
      store.activities.push({ ...preset })
    }
  }

  store.setActivities([...store.activities])
}
// 直前の配列を覚える
let prevActivities = []
const find = name => newActivities.find(a => a.name === name);
// watchの外で、直前のリストを覚えておくための変数
let prevActivityNames = [];

watch(
  () => store.activities,
  (newActivities) => {
    // --- 1. 抽出部分（しっかり残します！） ---
    const find = (name) => newActivities.find(a => a.name === name);

    const reading = find('読書');
    const study = find('勉強');
    const illustration = find('イラスト');
    const cooking = find('お菓子作り');
    const jogging = find('ジョギング');
    const guitar = find('ギター');
    const gardening = find('ガーデニング');
    const game = find('ゲーム');
    const movie = find('映画鑑賞');
    const handmade = find('ハンドメイド / 編み物');
    const workout = find('筋トレ');
    const cycling = find('サイクリング');
    const karaoke = find('カラオケ / 歌');

    // --- 2. 「今クリックされたもの」を特定するロジック ---
    const currentNames = newActivities.map(a => a.name);
    // 前回のリストにはいなくて、今回のリストにいる名前を探す
    const addedName = currentNames.find(name => !prevActivityNames.includes(name));

    if (addedName) {
      // クリックされたのが「勉強」だったら、study変数（抽出データ）を使ってリアクション
      if (addedName === '勉強' && study) {
        avatarMood.value = 'happy';
        avatarMessage.value = '勉強バッチリ！その調子！🔥';
      } 
      else if (addedName === 'イラスト' && illustration) {
        avatarMood.value = 'happy';
        avatarMessage.value = '素敵なイラストを描いてね🎨';
      }
      else if (addedName === 'ギター' && guitar) {
        avatarMood.value = 'fun';
        avatarMessage.value = 'ギターの音色、聴きたいな！🎸';
      }
      else if (addedName === 'お菓子作り' && cooking) {
        avatarMood.value = 'happy';
        avatarMessage.value = '美味しいお菓子ができるかな？🍪';
      }
      else if (addedName === 'ハンドメイド / 編み物' && handmade) {
        avatarMood.value = 'happy';
        avatarMessage.value = '手作り、集中しちゃいそうだね🧶';
      }
      else if (addedName === '筋トレ' && workout) {
        avatarMood.value = 'energetic';
        avatarMessage.value = '筋トレでリフレッシュしよう！💪';
      }
      else if (addedName === 'ジョギング' && jogging) {
        avatarMood.value = 'happy';
        avatarMessage.value = 'ジョギングで良い汗流そう！🏃';
      }
      else if (addedName === 'サイクリング' && cycling) {
        avatarMood.value = 'happy';
        avatarMessage.value = 'サイクリング、風が気持ち良さそう！🚴';
      }
      else if (addedName === 'カラオケ / 歌' && karaoke) {
        avatarMood.value = 'fun';
        avatarMessage.value = 'カラオケで盛り上がろう！🎤';
      }
      else if (addedName === 'ゲーム' && game) {
        avatarMood.value = 'happy';
        avatarMessage.value = 'ゲームタイム楽しんでね！🎮';
      }
      else if (addedName === '映画鑑賞' && movie) {
        avatarMood.value = 'relaxed';
        avatarMessage.value = 'ゆったり映画鑑賞タイムだね🎬';
      }
      else if (addedName === 'ガーデニング' && gardening) {
        avatarMood.value = 'happy';
        avatarMessage.value = 'お花のお世話、癒されるね🌿';
      }
      else if (addedName === '読書' && reading) {
        avatarMood.value = 'happy';
        avatarMessage.value = '読書で新しい発見があるかも📚';
      }
    }

    // --- 3. 状態の保存と、全削除時の対応 ---
    if (newActivities.length === 0) {
      avatarMood.value = 'normal';
      avatarMessage.value = '今日は何をする？';
    }

    // 最後に今回のリストを保存して、次回のクリックと比較できるようにする
    prevActivityNames = [...currentNames];
  },
  { deep: true }
);

// アクテビティ手動追加
// --- アクテビティ手動追加 ---
function addCustomActivity() {
  const act = newActivity.value.trim();
  if (!act || isSelected(act)) return;

  let duration = 60; // デフォルト時間

  // store内に parseFlexibleTime 関数を使う
  if (typeof store.parseFlexibleTime === "function") {
    const timeMatch = act.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      const parsed = store.parseFlexibleTime(timeMatch[1]);
      if (parsed !== null) duration = parsed;
    }
  }

  // 時間文字列を除去して活動名だけにする
  const name = act.replace(/(\d{1,2}:\d{2})/, "").trim();

  store.activities.push({
    name,
    duration,
  });

  store.setActivities([...store.activities]);
  newActivity.value = "";
}

// 特定のインデックスを指定して削除し、ストアを更新する関数
// 選択中の活動を個別に削除する
function removeSelectedActivity(index) {
  // 指定したインデックスの要素を1つ削除
  store.activities.splice(index, 1);
  
  // ストアを更新
  store.setActivities([...store.activities]);
  
  // 削除したあとのリアクション（任意）
  avatarMood.value = "thinking";
  avatarMessage.value = "ひとつ消したんだね。他には何をする？";
}

// スライダーで時間を更新
function updateDuration(index, newDuration) {
  store.activities[index].duration = newDuration
  store.setActivities([...store.activities])
}

onMounted(() => {
  const winkImg = new Image();
  winkImg.src = new URL("@/assets/avatar/wink.png", import.meta.url).href;
});

// 保存＋SchedulePreview画面へ遷移
//最後はウィンク！
// 保存ボタンを押した時
async function saveAndReturn() {
  console.log("✅ saveAndReturn() 発火");

  // 👇 保存ボタンを押した瞬間に強制wink化
  avatarMood.value = "wink";
  avatarMessage.value = "スケジュール作成中...";

  // ここでユーザー操作トリガーのフラグを立てる
  userDidSave.value = true; 

  // store保存
  store.setActivities([...store.activities]);

  // 👇 winkを1秒間確実に表示
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 👇 そのあとローディングを出す
  isLoading.value = true;

  // ローディング中の待機
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 👇 ローディングが終わったら遷移
  isLoading.value = false;
  router.push("/schedule-preview");
}
watch(avatarMood, (newVal) => {
  console.log("🎭 avatarMood が変化:", newVal);
});

</script>


<style>
/* ActivityInput独自調整のみ残す */
.activity-input {
  position: relative;
  z-index: 1;
  padding: 2rem;
}

/* タグリスト */
.preset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.2rem;
}

.tag {
  padding: 0.5rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: #9ccfff;
}

.tag.selected {
  background: linear-gradient(135deg, #00c3ff 0%, #6e00ff 45%, #00ffd5 100%);
  color: white;
  box-shadow: 0 0 12px rgba(0,255,255,0.4);
}

/* 手動入力エリア */
.manual-input input {
  flex: 1;
}

/* 選択リスト */
.selected-list {
  margin-top: 1.5rem;
}
/* 削除ボタン */
.btn-delete {
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.5);
  color: #ff6b6b;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(255, 0, 0, 0.4);
  transform: scale(1.1);
}



/* アバター固定位置 */
.avatar-fixed-wrapper {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 10;
}

/* アニメーション */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.galaxy-card::before {
  pointer-events: none !important;
}

.activity-input,
.activity-input * {
  position: relative;
  z-index: 2; /* これで上にくる */
}
</style>
