<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Grid, List, Edit, Delete, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { collectionApi } from '../api/collection.js'

const route = useRoute()
const router = useRouter()

// 用户ID
const userId = ref(route.params.userId || JSON.parse(localStorage.getItem('user'))?.id)
const currentUserId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.id
})

// 判断是否是自己的空间
const isOwnSpace = computed(() => {
  return currentUserId.value && userId.value && String(currentUserId.value) === String(userId.value)
})

// 加载状态
const loading = ref(false)

// 视图类型：grid-宫格, list-列表
const viewType = ref('grid')

// 合集列表
const collections = ref([])

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 创建合集对话框
const createDialogVisible = ref(false)
const creating = ref(false)
const newCollection = ref({
  name: '',
  description: '',
  cover: null,
  coverUrl: '',
  isPublic: true
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取默认封面
const getDefaultCover = () => {
  return 'https://picsum.photos/id/1025/400/225'
}

// 加载合集列表
const loadCollections = async () => {
  if (!userId.value) return
  
  loading.value = true
  try {
    const response = await collectionApi.getUserCollections(
      userId.value,
      pagination.value.currentPage,
      pagination.value.pageSize
    )
    if (response.code === 200) {
      collections.value = response.data?.list || []
      pagination.value.total = response.data?.total || 0
    }
  } catch (error) {
    console.error('获取合集列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到合集详情
const goToCollectionDetail = (collectionId) => {
  router.push(`/collection/${collectionId}`)
}

// 跳转到创建合集页面
const goToCreateCollection = () => {
  router.push('/collection/create')
}

// 跳转到编辑合集页面
const goToEditCollection = (collectionId, event) => {
  event.stopPropagation()
  router.push(`/collection/${collectionId}/edit`)
}

// 打开创建对话框
const openCreateDialog = () => {
  newCollection.value = {
    name: '',
    description: '',
    cover: null,
    coverUrl: '',
    isPublic: true
  }
  createDialogVisible.value = true
}

// 处理封面上传
const handleCoverChange = (file) => {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('封面图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
    return false
  }

  newCollection.value.cover = file.raw
  newCollection.value.coverUrl = URL.createObjectURL(file.raw)
  return false
}

// 创建合集
const handleCreateCollection = async () => {
  if (!newCollection.value.name.trim()) {
    ElMessage.warning('请输入合集名称')
    return
  }

  creating.value = true
  try {
    const response = await collectionApi.createCollection({
      name: newCollection.value.name,
      description: newCollection.value.description,
      cover: newCollection.value.cover,
      isPublic: newCollection.value.isPublic
    })
    
    if (response.code === 200) {
      ElMessage.success('创建成功')
      createDialogVisible.value = false
      loadCollections()
      // 跳转到编辑页面添加稿件
      if (response.data?.id) {
        router.push(`/collection/${response.data.id}/edit`)
      }
    } else {
      ElMessage.error(response.message || '创建失败')
    }
  } catch (error) {
    console.error('创建合集失败:', error)
    ElMessage.error('创建合集失败')
  } finally {
    creating.value = false
  }
}

// 删除合集
const handleDeleteCollection = async (collection, event) => {
  event.stopPropagation()
  
  try {
    await ElMessageBox.confirm(
      `确定要删除合集 "${collection.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await collectionApi.deleteCollection(collection.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      loadCollections()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除合集失败:', error)
      ElMessage.error('删除合集失败')
    }
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadCollections()
}

// 处理每页数量变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  loadCollections()
}

onMounted(() => {
  loadCollections()
})
</script>

<template>
  <div class="collection-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">合集和列表</h1>
        <span class="collection-count">共 {{ pagination.total }} 个合集</span>
      </div>
      <div class="header-right">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewType === 'grid' }"
            @click="viewType = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewType === 'list' }"
            @click="viewType = 'list'"
          >
            <el-icon><List /></el-icon>
          </button>
        </div>
        <!-- 创建按钮 -->
        <el-button
          v-if="isOwnSpace"
          type="primary"
          :icon="Plus"
          @click="openCreateDialog"
        >
          新建合集
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="collections.length === 0" class="empty-state">
      <el-empty description="暂无合集">
        <el-button
          v-if="isOwnSpace"
          type="primary"
          @click="openCreateDialog"
        >
          创建合集
        </el-button>
      </el-empty>
    </div>

    <!-- 宫格视图 -->
    <div v-else-if="viewType === 'grid'" class="collections-grid">
      <!-- 新建合集卡片 -->
      <div
        v-if="isOwnSpace"
        class="collection-card new-collection"
        @click="openCreateDialog"
      >
        <div class="new-collection-content">
          <el-icon :size="48"><Plus /></el-icon>
          <span>新建合集</span>
        </div>
      </div>

      <!-- 合集卡片 -->
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="collection-card"
        @click="goToCollectionDetail(collection.id)"
      >
        <div class="collection-cover">
          <img
            :src="collection.coverUrl || getDefaultCover()"
            :alt="collection.name"
          />
          <div class="collection-overlay">
            <div class="video-count">
              <el-icon><VideoPlay /></el-icon>
              <span>{{ collection.videoCount || 0 }} 个视频</span>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div v-if="isOwnSpace" class="collection-actions">
            <el-button
              type="primary"
              circle
              size="small"
              @click="goToEditCollection(collection.id, $event)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              type="danger"
              circle
              size="small"
              @click="handleDeleteCollection(collection, $event)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="collection-info">
          <h3 class="collection-title">{{ collection.name }}</h3>
          <p class="collection-desc">{{ collection.description || '暂无描述' }}</p>
          <div class="collection-meta">
            <span class="update-time">更新于 {{ formatDate(collection.updateTime) }}</span>
            <span v-if="!collection.isPublic" class="private-tag">私密</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="collections-list">
      <!-- 新建合集行 -->
      <div
        v-if="isOwnSpace"
        class="collection-list-item new-collection-row"
        @click="openCreateDialog"
      >
        <div class="new-collection-content">
          <el-icon :size="24"><Plus /></el-icon>
          <span>新建合集</span>
        </div>
      </div>

      <!-- 合集列表项 -->
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="collection-list-item"
        @click="goToCollectionDetail(collection.id)"
      >
        <div class="list-cover">
          <img
            :src="collection.coverUrl || getDefaultCover()"
            :alt="collection.name"
          />
          <div class="list-video-count">
            <el-icon><VideoPlay /></el-icon>
            <span>{{ collection.videoCount || 0 }}</span>
          </div>
        </div>
        <div class="list-info">
          <h3 class="list-title">{{ collection.name }}</h3>
          <p class="list-desc">{{ collection.description || '暂无描述' }}</p>
          <div class="list-meta">
            <span>更新于 {{ formatDate(collection.updateTime) }}</span>
            <span v-if="!collection.isPublic" class="private-tag">私密</span>
          </div>
        </div>
        <div v-if="isOwnSpace" class="list-actions">
          <el-button
            type="primary"
            text
            @click="goToEditCollection(collection.id, $event)"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            type="danger"
            text
            @click="handleDeleteCollection(collection, $event)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 创建合集对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建合集"
      width="500px"
      destroy-on-close
    >
      <el-form label-position="top">
        <!-- 封面上传 -->
        <el-form-item label="合集封面">
          <el-upload
            class="cover-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleCoverChange"
            accept="image/jpeg,image/png"
          >
            <div v-if="newCollection.coverUrl" class="cover-preview">
              <img :src="newCollection.coverUrl" />
            </div>
            <div v-else class="cover-placeholder">
              <el-icon :size="32"><Plus /></el-icon>
              <span>点击上传封面</span>
              <span class="cover-hint">支持 JPG、PNG 格式，最大 2MB</span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 合集名称 -->
        <el-form-item label="合集名称" required>
          <el-input
            v-model="newCollection.name"
            placeholder="请输入合集名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- 合集描述 -->
        <el-form-item label="合集描述">
          <el-input
            v-model="newCollection.description"
            type="textarea"
            :rows="3"
            placeholder="请输入合集描述（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 是否公开 -->
        <el-form-item>
          <el-checkbox v-model="newCollection.isPublic">
            公开合集
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="creating"
          @click="handleCreateCollection"
        >
          创建并添加视频
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.collection-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.collection-count {
  font-size: 14px;
  color: #9499a0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  gap: 8px;
  background-color: #f0f2f5;
  padding: 4px;
  border-radius: 6px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  color: #00aeec;
}

.toggle-btn.active {
  background-color: #fff;
  color: #00aeec;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 加载状态 */
.loading-state {
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
  background-color: #fff;
  border-radius: 8px;
}

/* 宫格视图 */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.collection-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.collection-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  overflow: hidden;
  background-color: #f0f0f0;
}

.collection-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-card:hover .collection-cover img {
  transform: scale(1.05);
}

.collection-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 12px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #fff;
}

.video-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.collection-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collection-card:hover .collection-actions {
  opacity: 1;
}

.collection-info {
  padding: 12px;
}

.collection-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 6px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-desc {
  font-size: 12px;
  color: #9499a0;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #9499a0;
}

.private-tag {
  padding: 2px 6px;
  background-color: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 11px;
}

/* 新建合集卡片 */
.new-collection {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #e0e0e0;
  background-color: #fafafa;
}

.new-collection:hover {
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.new-collection-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9499a0;
  font-size: 14px;
}

.new-collection:hover .new-collection-content {
  color: #00aeec;
}

/* 列表视图 */
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collection-list-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.new-collection-row {
  justify-content: center;
  border: 2px dashed #e0e0e0;
  background-color: #fafafa;
}

.new-collection-row:hover {
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.list-cover {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.list-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-video-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #9499a0;
}

.list-actions {
  display: flex;
  gap: 8px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

/* 封面上传 */
.cover-uploader {
  width: 100%;
}

.cover-preview {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 160px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cover-placeholder:hover {
  border-color: #00aeec;
  color: #00aeec;
}

.cover-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .collections-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .collections-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .collection-list-item {
    flex-wrap: wrap;
  }

  .list-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}

@media (max-width: 576px) {
  .collections-grid {
    grid-template-columns: 1fr;
  }
}
</style>
