import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router' 
import { Chart } from 'chart.js'
import pattern from 'patternomaly'
import CardLayout from '@/components/Common/CardLayout.vue';
import { useRegisterSW } from 'virtual:pwa-register/vue'


// Chart のデータセットの中で pattern を使う
const backgroundPattern = pattern.draw('diagonal', '#a0c4ff')
const app = createApp(App)
// カードのレイアウトを全部のコンポーネントで使える
app.component('CardLayout', CardLayout);

export const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      if (confirm("新しいバージョンがあります！更新しますか？")) {
        updateServiceWorker()
      }
    },
    onOfflineReady() {
      console.log("オフライン利用準備OK")
    }
  })

//Service Worker 登録コードを追加
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(reg => {
        console.log("📦 Service Worker registered:", reg);
      });
    });
  }
  

app.use(createPinia())
app.use(router)
app.mount('#app')
