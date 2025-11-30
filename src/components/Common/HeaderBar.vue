 <!--共通のヘッダー-->
 <template>
  <div class="header-bar">
    <h4 class="title">TimeWheel</h4>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.header-bar {
  top: 1rem;          /* 上からの距離 */
  right: 1rem;        /* 右からの距離 */
  z-index: 1000;      /* ほとんどの背景より前に表示 */
}

.header-bar .title {
  font-family: 'Zen Dots', sans-serif;
  font-size: 2.5rem;         /* 必要に応じて調整 */
  letter-spacing: 0.1em;
  background: linear-gradient(90deg, #FF9900, #FFD700, #FFFFFF);
  text-shadow: 
    -2px -2px 0 #f83e00,
     2px -2px 0 #0a01c3,
     0 0 10px rgba(255, 165, 0, 0.8),
     0 0 20px rgba(255, 215, 0, 0.5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
