<!-- mood または messageKey を受け取り → コメントを返す
だけに専念-->

<template>
    <p class="reaction-message" v-html="messageHtml"></p>
  </template>

<script setup>
import { computed } from "vue";
import { reactionMessages } from "@/components/Avatar/reactionMessages.js";

const props = defineProps({
  // アバターの反応キー（happy / good / normal / low）
  messageKey: {
    type: String,
    default: "normal"
  }
});

// メッセージに改行タグを挿入するロジックを追加
const rawMessage = computed(() => {
  const list = reactionMessages[props.messageKey] || reactionMessages.normal;
  return list[Math.floor(Math.random() * list.length)];
});

// 句読点（。、）を、それ自体を残しつつ <br> タグで置き換える
const messageHtml = computed(() => {
  let msg = rawMessage.value;
  
  // 句点「。」の後に改行タグを挿入（例: 「OK。やれる」 -> 「OK。<br>やれる」）
  // ただし、文字列の末尾にある句点の場合は改行しないように後方参照を使います
  msg = msg.replace(/。/g, '。<br>');
  
  // 読点「、」の後に改行タグを挿入（例: 「土曜、ゆったり」 -> 「土曜、<br>ゆったり」）
  msg = msg.replace(/、/g, '、<br>');

  msg = msg.replace(/！/g, '！<br>');

  return msg;
});

// mood に対応するメッセージ群からランダムで1つ返す
const message = computed(() => {
  const list = reactionMessages[props.messageKey] || reactionMessages.normal;

  return list[Math.floor(Math.random() * list.length)];
});
</script>



<style scoped>
/*吹き出しの中のメッセージ */
.reaction-message {
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
}
</style>
