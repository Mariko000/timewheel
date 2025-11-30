<template>
  <div class="galaxy-card">
    <!-- 🔹固定表示ロゴ -->
    <router-link to="/" class="logo-text">
  TimeWheel
</router-link>

    <!-- ページ内容 -->
    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>

/*  TimeWheel ロゴ（右上固定）*/
.logo-text {
  font-family: 'Baloo 2', sans-serif;
  padding: 5px;
  font-size: 2rem;
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





/* カードデザイン*/
.galaxy-card {
  position: relative;
  max-width: 420px;
  margin: 2rem auto;
  padding: 2.6rem 1.6rem 2rem; /* ⬆トップ余白増→ロゴが内容に重ならない */

  border-radius: 1.5rem;
  color: #d6e0ff;

  background: linear-gradient(145deg, #0a0f2c 0%, #20103d 40%, #03010a 100%);
  border: 1px solid rgba(80, 150, 255, 0.25);

  backdrop-filter: blur(20px) saturate(130%);
  box-shadow:
    0 0 25px rgba(0, 200, 255, 0.2),
    0 0 60px rgba(120, 0, 255, 0.15);
  overflow: visible;
  z-index: 1;
}

.galaxy-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 25%, rgba(0,255,255,0.28) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(180,100,255,0.28) 0%, transparent 55%),
    radial-gradient(circle at 50% 90%, rgba(100,255,200,0.25) 0%, transparent 60%);
  mix-blend-mode: screen;
  animation: auroraFlow 8s ease-in-out infinite alternate;
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
}

@keyframes auroraFlow {
  0% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(45deg) brightness(1.15); }
  100% { filter: hue-rotate(90deg) brightness(1); }
}

/* 内容 */
.card-content {
  position: relative;
  z-index: 2;
}

/* スマホ用（〜480px） */
@media screen and (max-width: 480px) {
  .galaxy-card {
    padding: 2rem 1rem 1.5rem;
    border-radius: 1rem;  /* 角を少し丸める */
  }

  .logo-text {
    font-size: 1.5rem;    /* ロゴを小さめに */
  }
}

/* タブレット用（481px〜768px） */
@media screen and (min-width: 481px) and (max-width: 768px) {
  .galaxy-card {
    padding: 2.3rem 1.2rem 1.8rem;
    border-radius: 1.2rem;
  }

  .logo-text {
    font-size: 1.8rem;
  }
}

/* PC用（769px〜） */
@media screen and (min-width: 769px) {
  .galaxy-card {
    padding: 2.6rem 1.6rem 2rem;
    border-radius: 1.5rem;
  }

  .logo-text {
    font-size: 2rem;
  }
}

</style>