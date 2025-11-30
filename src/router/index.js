import { createRouter, createWebHistory } from 'vue-router'

// 各ページコンポーネントをインポート
import TimeSetup from '@/components/TimeSetup.vue'
import ActivityInput from '@/components/ActivityInput.vue'
import SchedulePreview from '@/components/SchedulePreview.vue'
import FinishView from '@/components/FinishView.vue'
import ResultView from '@/components/ResultView.vue'
import WeekData from '@/components/WeekData.vue'
import OpeningAnimation from '@/components/Avatar/OpeningAnimation.vue'
import scheduleDetail from '@/components/ScheduleDetail.vue'

const routes = [
  {
    path: '/',
    name: 'OpeningAnimation',
    component: OpeningAnimation
  },
  {
    path: '/TimeSetup',
    name: 'TimeSetup',
    component: TimeSetup
  },
  { path: '/activity-input', name: 'ActivityInput', component: ActivityInput },
  { path: '/schedule-preview', name: 'SchedulePreview', component: SchedulePreview },
  { path: '/FinishView', name: 'FinishView', component: FinishView },
  { path: '/result', name: 'ResultView',component: ResultView},
  { path: '/WeekData', name: 'WeekData', component: WeekData },
  {
    path: '/scheduleDetail/:date',  // ← :date の前に /
    name: 'scheduleDetail',
    component: scheduleDetail
  }// params を受け取る
  

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
