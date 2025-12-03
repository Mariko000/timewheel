<template>
  <!-- 後で導入予定 -->
  <router-view />
</template>

<script setup>
import './page_design.css'

//Notification API 初回アプリ起動時に通知の権限をリクエスト
//main.js だと Vue がまだ完全に mount される前に動くのでここに

import { onMounted } from 'vue'

onMounted(() => {
  if ('Notification' in window) {
    Notification.requestPermission().then(result => {
      console.log("通知権限:", result)
    })
  }
})
</script>

<style scoped>
/* 必要に応じて全体スタイルを追加 */
</style>
