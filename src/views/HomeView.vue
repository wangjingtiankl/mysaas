<!-- src/views/HomeView.vue -->
<template>
  <div class="welcome-container">
    <h1>欢迎使用！</h1>
    <p>这是一个NFC/二维码智能营销服务页面。</p>
    <p>请通过类似 <code>/#/p/test-shop</code> 的链接来访问您的商家页面。</p>
  </div>
</template>

<style scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  text-align: center;
  font-family: sans-serif;
  color: #333;
}
code {
  background-color: #eee;
  padding: 2px 6px;
  border-radius: 4px;
  color: #c7254e;
}
</style>