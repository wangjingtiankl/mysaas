<!--店铺编辑-->

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>商家管理后台</h1>
      <button @click="handleLogout" class="logout-btn">退出登录</button>
    </header>

    <div v-if="isLoading" class="loading-state">
      正在加载数据，请稍候...
    </div>

    <div v-if="error" class="error-state">
      <p>加载失败：{{ error }}</p>
      <button @click="fetchData">重试</button>
    </div>

    <main v-if="!isLoading && !error" class="content-grid">
      <!-- Section 1: 落地页配置 -->
      <section class="card">
        <h2>
          <span class="icon">📄</span> 落地页配置
        </h2>

        <div class="form-group">
          <label for="pageSlug">页面路径 (Slug)</label>
          <input id="pageSlug" v-model="pageData.page_slug" type="text" placeholder="例如: my-cool-shop">
          <p class="form-hint">
            顾客访问地址: <strong>{{ pageUrl }}</strong>
          </p>
        </div>

        <div class="form-group">
          <label for="pageTitle">页面标题</label>
          <input id="pageTitle" v-model="pageData.page_title" type="text" placeholder="例如: 欢迎光临，碰一碰领福利">
        </div>

        <div class="form-group">
          <label for="shopName">店铺名称</label>
          <input id="shopName" v-model="pageData.config_json.shopInfo.name" type="text">
        </div>

        <div class="form-group">
          <label for="shopSlogan">店铺口号</label>
          <input id="shopSlogan" v-model="pageData.config_json.shopInfo.slogan" type="text">
        </div>

        <hr>

        <h3>自定义按钮</h3>
        <div v-for="(button, index) in pageData.config_json.buttons" :key="index" class="button-editor">
          <input v-model="button.label" placeholder="按钮名称 (如: 大众点评)">
          <input v-model="button.url" placeholder="跳转链接">
          <button @click="removeButton(index)" class="remove-btn">✖</button>
        </div>
        <button @click="addButton" class="add-btn">+ 新增按钮</button>

        <div class="card-footer">
          <button @click="savePageChanges" :disabled="isSavingPage" class="save-btn">
            {{ isSavingPage ? '保存中...' : '保存页面配置' }}
          </button>
          <p v-if="pageSaveStatus" class="status-message">{{ pageSaveStatus }}</p>
        </div>
      </section>

      <!-- Section 2: 抖音分享素材 -->
      <section class="card">
        <h2>
          <span class="icon">🎬</span> 抖音分享素材 (一键发布)
        </h2>

        <div class="form-group">
          <label for="videoFile">选择视频文件 (mp4)</label>
          <input id="videoFile" type="file" @change="handleFileChange" accept="video/mp4">
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-bar">
            <div class="progress-bar-inner" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p v-if="uploadProgress === 100" class="form-hint success-text">上传完成！</p>
        </div>

        <div class="form-group">
          <label for="materialTitle">默认文案</label>
          <textarea id="materialTitle" v-model="material.title" rows="3" placeholder="例如：鸭子很大一只，出货挺快的..."></textarea>
        </div>

        <div class="form-group">
          <label for="hashtags">话题标签 (用逗号隔开)</label>
          <input id="hashtags" v-model="hashtagsInput" type="text" placeholder="北京烤鸭,美食探店">
        </div>

        <div class="card-footer">
          <button @click="uploadAndSaveMaterial" :disabled="isSavingMaterial" class="save-btn">
            {{ isSavingMaterial ? '处理中...' : '保存视频素材' }}
          </button>
          <p v-if="materialStatus" class="status-message">{{ materialStatus }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue';
import {useRouter, useRoute} from 'vue-router';
import axios from 'axios';

// --- 基本配置 ---
const API_BASE_URL = 'https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com';
const router = useRouter();
const route = useRoute();

// --- 状态管理 ---
const isLoading = ref(true);
const error = ref(null);
const isCreatingNew = ref(false); // 判断是新建还是编辑
const originalSlug = ref(''); // 保存原始 slug 用于更新 API

// 页面配置模块状态
const pageData = ref({
  page_slug: '',
  page_title: '',
  config_json: {
    shopInfo: {name:'', slogan:''},
    buttons: []
  }
});
const isSavingPage = ref(false);
const pageSaveStatus = ref('');

// 视频素材模块状态
const material = ref({title: ''});
const hashtagsInput = ref('');
const selectedFile = ref(null);
const uploadProgress = ref(0);
const isSavingMaterial = ref(false);
const materialStatus = ref('');

// --- API 请求封装 ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器，自动附加Token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器，处理认证失败
apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('accessToken');
        router.push('/login');
      }
      return Promise.reject(error);
    }
);

// --- 计算属性 ---
const pageUrl = computed(() => {
  if (!pageData.value.page_slug) return '请先设置页面路径';
  return `${window.location.origin}/#/p/${pageData.value.page_slug}`;
});

// --- 生命周期钩子和侦听器 ---
onMounted(() => {
  handleRouteChange(route.params.slug);
});

// 使用 watch 侦听路由变化，例如从 /admin/page/a 导航到 /admin/page/b
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    handleRouteChange(newSlug);
  }
});

// 封装路由处理逻辑
const handleRouteChange = (slug) => {
  if (slug && slug !== 'new') {
    isCreatingNew.value = false;
    originalSlug.value = slug;
    fetchData(slug);
  } else {
    isCreatingNew.value = true;
    isLoading.value = false;
    error.value = null;
    originalSlug.value = '';
    // 设置一个干净的默认状态给新页面
    pageData.value = {
      page_slug: '',
      page_title: '',
      config_json: {
        shopInfo: { name: '', slogan: '' },
        buttons: [{ label: '微信买单', url: 'weixin://' }]
      }
    };
  }
};

// --- 方法 ---
const fetchData = async (slugToFetch) => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await apiClient.get(`/api/pages/${slugToFetch}`);
    const apiData = response.data;

    // --- 开始数据结构安全处理 ---

    // 1. 确保 config_json 是一个对象
    if (!apiData.config_json || typeof apiData.config_json !== 'object') {
      apiData.config_json = {};
    }

    // 2. 确保 config_json.shopInfo 是一个对象
    if (!apiData.config_json.shopInfo || typeof apiData.config_json.shopInfo !== 'object') {
      apiData.config_json.shopInfo = {};
    }

    // 3. 确保 config_json.buttons 是一个数组
    if (!Array.isArray(apiData.config_json.buttons)) {
      apiData.config_json.buttons = [];
    }

    pageData.value = apiData;
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.error || '无法连接到服务器';
  } finally {
    isLoading.value = false;
  }
};

// 页面配置方法
const addButton = () => {
  pageData.value.config_json.buttons.push({label: '', url: ''});
};

const removeButton = (index) => {
  pageData.value.config_json.buttons.splice(index, 1);
};

const savePageChanges = async () => {
  isSavingPage.value = true;
  pageSaveStatus.value = '';

  try {
    if (isCreatingNew.value) {
      // --- 创建新页面 ---
      // 调用 POST /api/pages
      await apiClient.post('/api/pages', pageData.value);
      pageSaveStatus.value = '✅ 创建成功！';

      // 创建成功后，跳转到新页面的编辑页，并刷新状态
      router.push({ name: 'MerchantAdmin', params: { slug: pageData.value.page_slug } }).then(() => {
        // isCreatingNew.value = false; // 路由变化会自动处理这个
        // originalSlug.value = pageData.value.page_slug;
      });

    } else {
      // --- 更新现有页面 ---
      // 调用 PUT /api/pages/:slug
      await apiClient.put(`/api/pages/${originalSlug.value}`, pageData.value);
      pageSaveStatus.value = '✅ 更新成功！';

      // 如果用户修改了 slug，URL 也需要同步更新
      if (originalSlug.value !== pageData.value.page_slug) {
        router.push({ name: 'MerchantAdmin', params: { slug: pageData.value.page_slug }});
      }
    }
  } catch (err) {
    pageSaveStatus.value = `❌ 保存失败: ${err.response?.data?.error || '未知错误'}`;
  } finally {
    isSavingPage.value = false;
    setTimeout(() => pageSaveStatus.value = '', 4000);
  }
};

// 视频素材方法
const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  uploadProgress.value = 0; // 重置进度条
};

const uploadAndSaveMaterial = async () => {
  if (!selectedFile.value) {
    materialStatus.value = '⚠️ 请先选择一个视频文件';
    return;
  }
  isSavingMaterial.value = true;
  materialStatus.value = '1/3: 正在获取上传许可...';

  try {
    // 1. 获取预签名URL
    const signatureResponse = await apiClient.get('/api/upload-signature');
    const {uploadUrl, videoUrl} = signatureResponse.data;

    // 2. 使用 axios.put 直传文件到COS
    materialStatus.value = '2/3: 正在上传视频...';
    // 注意：这里需要创建一个不带认证头的 axios 实例来上传，因为预签名URL本身已包含认证
    await axios.put(uploadUrl, selectedFile.value, {
      headers: {'Content-Type': selectedFile.value.type},
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });

    // 3. 保存素材信息到数据库
    materialStatus.value = '3/3: 正在保存素材信息...';
    const hashtags = hashtagsInput.value.split(/[,，]/).map(h => h.trim()).filter(h => h);

    // TODO: 这里需要根据你的新表结构调整，比如增加 material_type
    await apiClient.post('/api/materials', {
      material_type: 'video',
      title: material.value.title,
      media_url: videoUrl,
      hashtags: hashtags,
    });

    materialStatus.value = '✅ 素材保存成功！';

  } catch (err) {
    materialStatus.value = `❌ 操作失败: ${err.response?.data?.error || '请检查控制台'}`;
    console.error(err);
  } finally {
    isSavingMaterial.value = false;
    setTimeout(() => materialStatus.value = '', 5000);
  }
};

// 通用方法
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  router.push('/login');
};
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  font-family: sans-serif;
  color: #333;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.logout-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #d32f2f;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card h2 {
  margin-top: 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

.form-hint {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}

.form-hint strong {
  color: #007bff;
}

.button-editor {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.button-editor input {
  flex: 1;
}

.remove-btn, .add-btn {
  border: none;
  cursor: pointer;
  border-radius: 5px;
  padding: 0.5rem 0.75rem;
}

.remove-btn {
  background-color: #fde8e8;
  color: #c53030;
}

.add-btn {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px dashed #91d5ff;
}

.card-footer {
  margin-top: 2rem;
  text-align: right;
}

.save-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.save-btn:hover:not(:disabled) {
  background-color: #218838;
}

.status-message {
  margin-top: 1rem;
  text-align: right;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  background-color: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
  height: 10px;
  margin-top: 10px;
}

.progress-bar-inner {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s ease;
}

.success-text {
  color: #28a745;
  font-weight: bold;
}
</style>