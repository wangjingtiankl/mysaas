<!--一个账号下的所有店铺-->

<template>
  <div class="dashboard-home">
    <header class="dashboard-header">
      <h1>我的页面列表</h1>
      <router-link :to="{ name: 'MerchantAdmin', params: { slug: 'new' } }" class="create-btn">
        + 创建新页面
      </router-link>
    </header>

    <div v-if="isLoading" class="loading-state">正在加载页面列表...</div>
    <div v-if="error" class="error-state">加载失败: {{ error }}</div>

    <div v-if="!isLoading && !error">
      <div v-if="pages.length === 0" class="empty-state">
        <p>您还没有创建任何页面。</p>
        <p>点击右上角的 "创建新页面" 开始吧！</p>
      </div>

      <ul v-else class="page-list">
        <li v-for="page in pages" :key="page.page_slug" class="page-item">
          <div class="page-info">
            <h3>{{ page.page_title || '（未命名页面）' }}</h3>
            <p>路径: /p/{{ page.page_slug }}</p>
          </div>
          <div class="page-actions">
            <a :href="`/#/p/${page.page_slug}`" target="_blank" class="action-btn view-btn">预览</a>
            <router-link :to="{ name: 'MerchantAdmin', params: { slug: page.page_slug } }" class="action-btn edit-btn">
              编辑
            </router-link>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import axios from 'axios'; // 建议使用你封装的 apiClient

const API_BASE_URL = 'https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com';
const pages = ref([]);
const isLoading = ref(true);
const error = ref(null);

// 建议：创建一个 apiClient.js 文件来封装这个逻辑，避免重复
const apiClient = axios.create({baseURL: API_BASE_URL});
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const fetchPages = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get('/api/pages');
    pages.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || '无法获取页面列表';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchPages);
</script>

<style scoped>
/* 添加一些简单的样式让页面更好看 */
.dashboard-home {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.create-btn {
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  text-decoration: none;
}

.page-list {
  list-style: none;
  padding: 0;
}

.page-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.page-actions .action-btn {
  margin-left: 1rem;
  text-decoration: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
}

.view-btn {
  background-color: #6c757d;
  color: white;
}

.edit-btn {
  background-color: #28a745;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 5px;
}
</style>