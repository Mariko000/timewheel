<template>
  <CardLayout>
 
    <h3 class="text-glow">スケジュール基本設定（必須）</h3>
    <!-- アバター挨拶 -->
    <transition name="fade">
      <GuideAvatar
        :mood="avatarMood"
        :message="avatarMessage"
        key="avatar-message"
      />
    </transition>

    <form @submit.prevent="saveSetup">
      <!-- WAKE / SLEEP 横並び -->
      <div class="form-group time-pair">
        <div class="time-field">
          <label for="wakeTime" class="text-primary">WAKE</label>
          <input type="text" id="wakeTime" v-model="wakeTime" />
        </div>
        <div class="time-field">
          <label for="sleepTime" class="text-primary">SLEEP</label>
          <input type="text" id="sleepTime" v-model="sleepTime" />
        </div>
      </div>

      <!-- MAIN ACTIVITY -->
      <div class="form-group">
        <label for="mainActivity" class="text-primary">
          MAIN ACTIVITY
        </label>
        <select
          id="mainActivity"
          v-model="mainActivity"
          @change="handleChange"
        >
          <option
            v-for="activity in mainActivities"
            :key="activity.name"
            :value="activity.name"
          >
            {{ activity.name }}
            {{ activity.defaultStart ? `（${activity.defaultStart}〜${activity.defaultEnd}）` : '' }}
          </option>
        </select>

        <!-- カスタム設定 -->
        <div v-if="mainActivity === 'カスタム'" class="custom-time">
          <p class="text-dim">📅 カスタム作業時間を指定：</p>
          <label>開始：
            <input type="text" v-model="customStart" />
          </label>
          <label>終了：
            <input type="text" v-model="customEnd" />
          </label>
        </div>
      </div>

      <!-- MAIN ACTIVITY TIME -->
      <div
        class="accordion-header text-primary"
        @click="showSchoolSettings = !showSchoolSettings"
      >
        <span>MAIN ACTIVITY TIME</span>
        <span>{{ showSchoolSettings ? '▲' : '▼' }}</span>
      </div>

      <div v-if="showSchoolSettings">
        <div v-if="showSchoolTime" class="slider-group">
          <label class="text-primary">通学時間（分）：{{ schoolTime }}分</label>
          <input type="range" min="0" max="180" step="5" v-model="schoolTime" />
        </div>
        <div v-if="showCommuteTime" class="slider-group">
          <label class="text-primary">通勤時間（分）：{{ commuteTime }}分</label>
          <input type="range" min="0" max="180" step="5" v-model="commuteTime" />
        </div>
        <div v-if="showOutingTime" class="slider-group">
          <label class="text-primary">移動時間（分）：{{ outingTime }}分</label>
          <input type="range" min="0" max="180" step="5" v-model="outingTime" />
        </div>
      </div>

      <!-- BREAK STYLE -->
      <button
        type="button"
        class="btn-outline"
        v-if="!showExtraSettings"
        @click="showExtraSettings = true"
      >
        BREAK STYLE
      </button>

      <div v-if="showExtraSettings" class="form-group">
        <label for="breakStyle" class="text-primary">休憩スタイル：</label>
        <select id="breakStyle" v-model="breakStyle">
          <option value="" disabled selected>選択してください</option>
          <option value="分散型">分散型（短い休憩を複数回）</option>
          <option value="まとまった長め">まとまった長め（夜に1〜2回）</option>
          <option value="休憩なし">休憩なし</option>
        </select>
      </div>

      <!-- GENERATE SCHEDULE -->
      <button type="submit" class="btn-neon" :disabled="isLoading">
        {{ isLoading ? "保存中..." : "GENERATE SCHEDULE →" }}
      </button>
    </form>

    <!-- ローディングアニメーション -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loader"></div>
      </div>
    </transition>
</CardLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { mainActivities } from '@/stores/mainActivities.js'
import GuideAvatar from "@/components/Avatar/GuideAvatar.vue"
import { useScheduleStore } from '@/stores/scheduleStore'


const showSchoolSettings = ref(false)
const showExtraSettings = ref(false)
const showCommuteTime = ref(false)
const showSchoolTime = ref(false)
const showOutingTime = ref(false)

const commuteTime = ref(30)
const schoolTime = ref(30)
const outingTime = ref(30)

const router = useRouter()
const store = useScheduleStore()

const wakeTime = ref(store.wakeTime || '06:00')
const sleepTime = ref(store.sleepTime || '23:00')
const mainActivity = ref(store.mainActivity || '学校')
const breakStyle = ref(store.breakStyle || '')
const customStart = ref(store.mainActivityStart || '09:00')
const customEnd = ref(store.mainActivityEnd || '17:00')

const avatarMood = ref("relax")
const avatarMessage = ref("こんにちは！今日の予定を立ててみましょう☀️")
const isLoading = ref(false)

onMounted(() => {
  store.resetAll()
  showSchoolTime.value = mainActivity.value === '学校'
  showCommuteTime.value = ['早番シフト','日勤帯','夜勤帯①','夜勤帯②'].includes(mainActivity.value)
  showOutingTime.value = mainActivity.value === 'カスタム'
})

function handleChange() {
  store.mainActivity = mainActivity.value
  switch (mainActivity.value) {
    case '学校':
      store.mainActivityStart = '08:00'
      store.mainActivityEnd = '18:00'
      break
    case '早番シフト':
      store.mainActivityStart = '07:00'
      store.mainActivityEnd = '15:00'
      break
    case '日勤帯':
      store.mainActivityStart = '08:30'
      store.mainActivityEnd = '17:30'
      break
    case '夜勤帯①':
      store.mainActivityStart = '16:00'
      store.mainActivityEnd = '09:00'
      break
    case '夜勤帯②':
      store.mainActivityStart = '22:00'
      store.mainActivityEnd = '06:00'
      break
    case '自由':
      store.mainActivityStart = null
      store.mainActivityEnd = null
      break
    case 'カスタム':
      store.mainActivityStart = customStart.value
      store.mainActivityEnd = customEnd.value
      break
    case 'なし':
      store.mainActivityStart = null
      store.mainActivityEnd = null
      break
  }
}

watch(mainActivity, (val) => {
  showSchoolTime.value = val === '学校'
  showCommuteTime.value = ['早番シフト','日勤帯','夜勤帯①','夜勤帯②'].includes(val)
  showOutingTime.value = val === 'カスタム'
})

async function saveSetup() {
  avatarMood.value = "happy"
  avatarMessage.value = "完璧です！次のステップへ進みましょう✨"
  isLoading.value = true

  store.wakeTime = wakeTime.value
  store.sleepTime = sleepTime.value

  if (mainActivity.value === 'カスタム') {
  store.mainActivityStart = customStart.value
  store.mainActivityEnd = customEnd.value
}
store.mainActivity = mainActivity.value
store.breakStyle = breakStyle.value
store.commuteTime = commuteTime.value
store.schoolTime = schoolTime.value

  await nextTick()
  setTimeout(() => {
    isLoading.value = false
    router.push("/activity-input")
  }, 3000)
}



</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

/* WAKE / SLEEP 横並び */
.time-pair {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.time-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-field label {
  width: 60px;
  text-align: right;
}

.time-field input[type="text"] {
  flex: 1;
  max-width: 120px;
}
</style>
