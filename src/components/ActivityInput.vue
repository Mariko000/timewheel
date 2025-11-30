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
    <button @click="saveAndReturn" class="btn-neon">
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
import { ref, onMounted, computed, watch } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useRouter } from 'vue-router'
import { nextTick } from "vue";




const router = useRouter()
const store = useScheduleStore()
const newActivity = ref('')

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
watch(
  () => store.activities,
  (newActivities) => {
    const reactions = [];

    const reading = newActivities.find(a => a.name === '読書');
    const study = newActivities.find(a => a.name === '勉強');
    const jogging = newActivities.find(a => a.name === 'ジョギング');
    const drawing = newActivities.find(a => a.name === 'イラスト');
    const baking = newActivities.find(a => a.name === 'お菓子作り');
    const guitar = newActivities.find(a => a.name === 'ギター');
    const gardening = newActivities.find(a => a.name === 'ガーデニング');
    const game = newActivities.find(a => a.name === 'ゲーム');
    const movie = newActivities.find(a => a.name === '映画鑑賞');
    const craft = newActivities.find(a => a.name === 'ハンドメイド / 編み物');
    const workout = newActivities.find(a => a.name === '筋トレ');
    const cycling = newActivities.find(a => a.name === 'サイクリング');
    const karaoke = newActivities.find(a => a.name === 'カラオケ / 歌');

    // --- 既存反応 ---
    if (reading?.duration >= 15) {
      reactions.push({ mood: "happy", text: "いいね！何の本読むの？" });
    }

    if (study) {
      if (study.duration < 30) {
        reactions.push({ mood: "sad", text: "勉強時間がちょっと短いね…" });
      } else {
        reactions.push({ mood: "happy", text: "勉強バッチリだね！" });
      }
    }

    if (jogging?.duration >= 30) {
      reactions.push({ mood: "surprise", text: "ジョギング頑張ってね！" });
    }

    // --- 新規アクティビティ反応 ---
    if (drawing?.duration >= 30) {
      reactions.push({ mood: "happy", text: "イラスト楽しそう！見せてほしいな〜" });
    }

    if (baking?.duration >= 60) {
      reactions.push({ mood: "happy", text: "お菓子作りいいね！甘い香りが漂ってきそう" });
    }

    if (guitar?.duration >= 30) {
      reactions.push({ mood: "happy", text: "ギター練習してるんだね！" });
    }

    if (gardening?.duration >= 30) {
      reactions.push({ mood: "relaxed", text: "ガーデニング素敵 気持ちよさそう" });
    }

    if (game?.duration >= 60) {
      reactions.push({ mood: "happy", text: "ゲームタイム楽しんでね！" });

    if (movie?.duration >= 60) {
      reactions.push({ mood: "relaxed", text: "映画鑑賞いいね！ゆったり楽しんでね🎬" });
    }

    if (craft?.duration >= 30) {
      reactions.push({ mood: "happy", text: "ハンドメイド楽しそう🧶完成品見たいな〜" });
    }

    if (workout?.duration >= 30) {
      reactions.push({ mood: "energetic", text: "筋トレ頑張ってるね💪" });
    }

    if (cycling?.duration >= 30) {
      reactions.push({ mood: "happy", text: "サイクリングいいね！風を感じて気持ちよさそう🚴‍♀️" });
    }

    if (karaoke?.duration >= 30) {
      reactions.push({ mood: "fun", text: "カラオケで盛り上がろう🎤楽しんでね！" });
    }

    // --- 最後にストアに反映 ---
    store.reactions = reactions;
  }



    // タイマー停止
    if (reactionTimer) {
      clearInterval(reactionTimer);
      reactionTimer = null;
    }

     // --- reactions が空なら早期 return ---

    if (reactions.length === 0) {
      avatarMood.value = "normal";
      avatarMessage.value = "今日は何をする？";
      return;
    }

    // 順番に切り替え
    let index = 0;
    const showReaction = () => {
      const r = reactions[index];
      avatarMood.value = r.mood;
      avatarMessage.value = r.text;
      index = (index + 1) % reactions.length;
    };

    showReaction();
    reactionTimer = setInterval(showReaction, 1500);
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
