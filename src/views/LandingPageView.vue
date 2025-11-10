<!--顾客跳转汇总-->

<template>
  <div class="landing-page">
    <div v-if="isLoading" class="status-indicator">
      <div class="spinner"></div>
      <p>正在加载店铺信息...</p>
    </div>

    <div v-if="error" class="status-indicator error-state">
      <h2>🙁</h2>
      <p>加载失败</p>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchPageData">重试</button>
    </div>

    <main v-if="!isLoading && !error && pageData" class="content">
      <header class="shop-header">
        <img v-if="shopInfo.logo" :src="shopInfo.logo" alt="店铺Logo" class="shop-logo">
        <h1 class="shop-name">{{ shopInfo.name }}</h1>
        <p class="shop-slogan">{{ shopInfo.slogan }}</p>
      </header>

      <section class="buttons-grid">
        <a v-for="(button, index) in buttons" :key="index" :href="button.url" class="action-button" target="_blank" rel="noopener noreferrer">
          <span class="button-icon">{{ getIconForType(button.type) }}</span>
          <span class="button-label">{{ button.label }}</span>
        </a>
      </section>

      <footer class="page-footer">
        <p>由 FX 提供技术支持</p>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

// --- 配置 ---
const API_BASE_URL = 'https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com';
const route = useRoute();

// --- 响应式状态 ---
const pageData = ref(null);
const isLoading = ref(true);
const error = ref(null);

// --- 计算属性，简化模板中的访问 ---
const shopInfo = computed(() => pageData.value?.shopInfo || {});
const buttons = computed(() => pageData.value?.buttons || []);

// --- 方法 ---
const fetchPageData = async () => {
  isLoading.value = true;
  error.value = null;
  const slug = route.params.slug;

  if (!slug) {
    error.value = '无效的页面地址。';
    isLoading.value = false;
    return;
  }

  try {
    // 注意：这个接口是公开的，不需要 token，所以直接用 axios 即可
    const response = await axios.get(`${API_BASE_URL}/page/${slug}`);

    // 后端返回的数据可能直接就是 config_json，也可能是包含 config_json 的对象
    // 根据你的后端代码 app.get('/page/:slug', ...) 它直接返回了 config_json
    const config = response.data;

    // 做一个安全校验，确保返回的是一个对象
    if (typeof config !== 'object' || config === null) {
      throw new Error('店铺配置信息格式不正确。');
    }

    pageData.value = config;

    // 动态设置页面标题
    if (pageData.value.shopInfo?.name) {
      document.title = pageData.value.shopInfo.name;
    }

  } catch (err) {
    if (err.response?.status === 404) {
      error.value = '该店铺不存在或已关闭。';
    } else {
      error.value = '网络似乎出了点问题，请稍后重试。';
    }
    console.error('Failed to fetch page data:', err);
  } finally {
    isLoading.value = false;
  }
};

// 根据按钮类型返回一个 emoji 图标，增加趣味性
const getIconForType = (type) => {
  switch (type) {
    case 'payment': return '💰';
    case 'review': return '🌟';
    case 'social': return '📱';
    case 'wifi': return '📶';
    default: return '🔗';
  }
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchPageData();
});
</script>

<style scoped>
:root {
  --primary-color: #007bff;
  --text-color: #333;
  --bg-color: #f4f7f6;
}

.landing-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--bg-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.content {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --- 状态指示器 --- */
.status-indicator {
  text-align: center;
  color: #666;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: var(--primary-color);
  animation: spin 1s ease infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.error-state h2 { font-size: 3rem; margin: 0; }
.error-state .error-message { color: #e74c3c; font-size: 0.9rem; }
.error-state button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--primary-color);
  background: white;
  color: var(--primary-color);
  border-radius: 20px;
  cursor: pointer;
}


/* --- 头部信息 --- */
.shop-header {
  padding: 2rem 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
}
.shop-logo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.shop-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}
.shop-slogan {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

/* --- 按钮网格 --- */
.buttons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 0.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.action-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}
.button-icon {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}
.button-label {
  font-size: 0.9rem;
}

/* --- 页脚 --- */
.page-footer {
  text-align: center;
  padding: 2rem 0 1rem;
  font-size: 0.8rem;
  color: #aaa;
}
</style>