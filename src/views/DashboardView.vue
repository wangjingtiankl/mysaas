<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>商家管理后台</h1>
      <button @click="handleLogout" class="logout-btn">退出登录</button>
    </header>

    <div v-if="isLoading" class="loading-state">正在加载数据，请稍候...</div>
    <div v-if="error" class="error-state">
      <p>加载失败：{{ error }}</p>
      <button @click="fetchAllData">重试</button>
    </div>

    <main v-if="!isLoading && !error" class="content-grid">
      <!-- Section 1: 落地页配置 -->
      <section class="card">
        <h2><span class="icon">📄</span> 落地页配置</h2>

        <!-- ... (此部分与上一版相同，保持不变) ... -->
        <div class="form-group">
          <label for="pageSlug">页面路径 (Slug)</label>
          <input id="pageSlug" v-model="pageData.page_slug" type="text" placeholder="例如: my-cool-shop">
          <p class="form-hint">顾客访问地址: <strong>{{ pageUrl }}</strong></p>
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
          <input v-model="button.label" placeholder="按钮名称">
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

      <!-- Section 2: 抖音分享素材管理 -->
      <section class="card">
        <div class="card-header">
          <h2><span class="icon">🎬</span> 抖音分享素材</h2>
          <button @click="openMaterialModal()" class="add-btn">+ 新增素材</button>
        </div>
        <div v-if="materials.length === 0" class="empty-state">
          暂无素材，点击右上角新增一个吧！
        </div>
        <ul v-else class="material-list">
          <li v-for="item in materials" :key="item.id">
            <div class="material-info">
              <span class="material-type">{{ item.material_type }}</span>
              <p class="material-title">{{ item.title }}</p>
            </div>
            <div class="material-actions">
              <button @click="openMaterialModal(item)">编辑</button>
              <button @click="deleteMaterial(item.id)" class="delete-btn">删除</button>
            </div>
          </li>
        </ul>
      </section>
    </main>

    <!-- 素材新增/编辑模态框 -->
    <div v-if="isMaterialModalOpen" class="modal-overlay" @click.self="closeMaterialModal">
      <div class="modal-content">
        <h3>{{ isEditingMaterial ? '编辑素材' : '新增素材' }}</h3>

        <div class="form-group">
          <label>素材类型</label>
          <select v-model="currentMaterial.material_type" :disabled="isEditingMaterial">
            <option value="video">视频</option>
            <option value="image">图片 (暂未开放)</option>
          </select>
        </div>

        <div v-if="currentMaterial.material_type === 'video'" class="form-group">
          <label for="videoFile">视频文件 (mp4)</label>
          <input id="videoFile" type="file" @change="handleFileChange" accept="video/mp4">
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-bar">
            <div class="progress-bar-inner" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p v-if="uploadProgress === 100" class="form-hint success-text">上传完成！新视频将替换旧视频。</p>
          <p v-if="currentMaterial.media_url && !selectedFile" class="form-hint">当前已关联视频，可重新上传替换。</p>
        </div>

        <div class="form-group">
          <label for="materialTitle">默认文案</label>
          <textarea id="materialTitle" v-model="currentMaterial.title" rows="3" placeholder="..."></textarea>
        </div>

        <div class="form-group">
          <label for="hashtags">话题标签 (用逗号隔开)</label>
          <input id="hashtags" v-model="hashtagsInput" type="text" placeholder="北京烤鸭,美食探店">
        </div>

        <div class="modal-footer">
          <button @click="closeMaterialModal" class="cancel-btn">取消</button>
          <button @click="saveMaterial" :disabled="isSavingMaterial" class="save-btn">
            {{ isSavingMaterial ? '保存中...' : '确认保存' }}
          </button>
        </div>
        <p v-if="materialStatus" class="status-message">{{ materialStatus }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue';
import {useRouter} from 'vue-router';
import axios from 'axios';

// --- 基本配置 ---
const API_BASE_URL = 'https://1259010340-65dsv2iaxk.ap-chengdu.tencentscf.com';
const router = useRouter();

// --- 状态管理 ---
const isLoading = ref(true);
const error = ref(null);

// 页面配置模块状态
const pageData = ref({page_slug: '', page_title: '', config_json: {shopInfo: {}, buttons: []}});
const isSavingPage = ref(false);
const pageSaveStatus = ref('');

// 素材模块状态
const materials = ref([]);
const isMaterialModalOpen = ref(false);
const isEditingMaterial = ref(false);
const currentMaterial = ref({});
const hashtagsInput = ref('');
const selectedFile = ref(null);
const uploadProgress = ref(0);
const isSavingMaterial = ref(false);
const materialStatus = ref('');

// --- API 请求封装 ---
const apiClient = axios.create({baseURL: API_BASE_URL});
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
    response => response,
    error => {
      if ([401, 403].includes(error.response?.status)) {
        localStorage.removeItem('accessToken');
        router.push('/login');
      }
      return Promise.reject(error);
    }
);

// --- 计算属性 ---
const pageUrl = computed(() => pageData.value.page_slug ? `${window.location.origin}/#/p/${pageData.value.page_slug}` : '请先设置页面路径');

// --- 生命周期钩子 ---
onMounted(() => {
  fetchAllData();
});

// --- 数据获取 ---
const fetchAllData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    await Promise.all([fetchPageData(), fetchMaterials()]);
  } catch (err) {
    error.value = '数据加载失败，请刷新重试。';
  } finally {
    isLoading.value = false;
  }
};
const fetchPageData = async () => {
  const {data} = await apiClient.get('/api/page');
  if (!data.config_json) data.config_json = {shopInfo: {}, buttons: []};
  pageData.value = data;
};
const fetchMaterials = async () => {
  const {data} = await apiClient.get('/api/materials');
  materials.value = data;
};

// --- 页面配置方法 ---
const addButton = () => pageData.value.config_json.buttons.push({label: '', url: ''});
const removeButton = (index) => pageData.value.config_json.buttons.splice(index, 1);
const savePageChanges = async () => {
  isSavingPage.value = true;
  pageSaveStatus.value = '';
  try {
    await apiClient.post('/api/page', pageData.value);
    pageSaveStatus.value = '✅ 保存成功！';
  } catch (err) {
    pageSaveStatus.value = `❌ 保存失败: ${err.response?.data?.error || '未知错误'}`;
  } finally {
    isSavingPage.value = false;
    setTimeout(() => pageSaveStatus.value = '', 3000);
  }
};

// --- 素材管理方法 ---
const openMaterialModal = (item = null) => {
  selectedFile.value = null;
  uploadProgress.value = 0;
  materialStatus.value = '';
  if (item) { // 编辑
    isEditingMaterial.value = true;
    currentMaterial.value = JSON.parse(JSON.stringify(item)); // 深拷贝，避免直接修改列表数据
    hashtagsInput.value = (currentMaterial.value.hashtags || []).join(',');
  } else { // 新增
    isEditingMaterial.value = false;
    currentMaterial.value = {
      material_type: 'video',
      title: '',
      content: '',
      media_url: '',
      hashtags: [],
    };
    hashtagsInput.value = '';
  }
  isMaterialModalOpen.value = true;
};

const closeMaterialModal = () => isMaterialModalOpen.value = false;

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
  uploadProgress.value = 0;
};

const saveMaterial = async () => {
  isSavingMaterial.value = true;
  materialStatus.value = '';

  try {
    // 步骤 1: 如果有新文件，先上传
    if (selectedFile.value) {
      materialStatus.value = '正在上传新视频...';
      const {data} = await apiClient.get('/api/upload-signature?type=video');
      await axios.put(data.uploadUrl, selectedFile.value, {
        headers: {'Content-Type': selectedFile.value.type},
        onUploadProgress: e => uploadProgress.value = Math.round((e.loaded * 100) / e.total)
      });
      currentMaterial.value.media_url = data.mediaUrl;
    }

    // 步骤 2: 准备要保存的数据
    const payload = {
      ...currentMaterial.value,
      hashtags: hashtagsInput.value.split(/[,，]/).map(h => h.trim()).filter(Boolean)
    };

    // 步骤 3: 调用新增或更新接口
    if (isEditingMaterial.value) {
      materialStatus.value = '正在更新素材信息...';
      await apiClient.put(`/api/materials/${currentMaterial.value.id}`, payload);
    } else {
      materialStatus.value = '正在创建新素材...';
      await apiClient.post('/api/materials', payload);
    }

    materialStatus.value = '✅ 保存成功！';
    await fetchMaterials(); // 刷新列表
    setTimeout(closeMaterialModal, 1000);

  } catch (err) {
    materialStatus.value = `❌ 操作失败: ${err.response?.data?.error || '请检查控制台'}`;
  } finally {
    isSavingMaterial.value = false;
  }
};

const deleteMaterial = async (id) => {
  if (window.confirm('确定要删除这个素材吗？此操作不可恢复。')) {
    try {
      await apiClient.delete(`/api/materials/${id}`);
      await fetchMaterials(); // 刷新列表
    } catch (err) {
      alert(`删除失败: ${err.response?.data?.error || '未知错误'}`);
    }
  }
};

// --- 通用方法 ---
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  router.push('/login');
};
</script>

<style scoped>
/* ... (大部分样式与上一版相同，这里只补充模态框和列表的样式) ... */
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
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
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

.form-group input, .form-group textarea, .form-group select {
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

.button-editor {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  align-items: center;
}

.remove-btn {
  background-color: #fde8e8;
  color: #c53030;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  padding: 0.5rem 0.75rem;
}

.add-btn {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px dashed #91d5ff;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 5px;
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
}

.save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.status-message {
  margin-top: 1rem;
  font-weight: 500;
}

/* 新增样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  color: #888;
  padding: 2rem 0;
}

.material-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.material-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.material-list li:last-child {
  border-bottom: none;
}

.material-info .material-type {
  background-color: #eee;
  color: #555;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-right: 8px;
  text-transform: uppercase;
}

.material-info .material-title {
  margin: 0;
  font-weight: 500;
}

.material-actions button {
  margin-left: 0.5rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 5px;
  cursor: pointer;
}

.material-actions .delete-btn {
  border-color: #f44336;
  color: #f44336;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  background: #eee;
  border: 1px solid #ccc;
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