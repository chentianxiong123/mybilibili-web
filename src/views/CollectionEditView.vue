<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Delete, Rank, Search, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { collectionApi } from '../api/collection.js'
import { manuscriptApi } from '../api/manuscript.js'

const route = useRoute()
const router = useRouter()

// 合集ID（如果有则为编辑模式，否则为创建模式）
const collectionId = ref(route.params.id)
const isEditMode = computed(() => !!collectionId.value)

// 当前用户ID
const currentUserId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.id
})

// 加载状态
const loading = ref(false)
const saving = ref(false)

// 合集信息
const collectionForm = ref({
  name: '',
  description: '',
  cover: null,
  coverUrl: '',
  isPublic: true
})

// 合集中的稿件
const manuscripts = ref([])

// 拖拽排序相关
const draggedIndex = ref(null)

// 添加稿件对话框
const addDialogVisible = ref(false)
const searchKeyword = ref('')
const userManuscripts = ref([])
const selectedManuscripts = ref([])
const manuscriptLoading = ref(false)

// 表单校验
const formRules = {
  name: [
    { required: true, message: '请输入合集名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)

// 获取默认封面
const getDefaultCover = () => {
  return 'https://picsum.photos/id/1025/400/225'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 加载合集详情
const loadCollectionDetail = async () => {
  if (!isEditMode.value) return
  
  loading.value = true
  try {
    const response = await collectionApi.getCollectionById(collectionId.value)
    if (response.code === 200) {
      const data = response.data
      collectionForm.value = {
        name: data.name,
        description: data.description || '',
        cover: null,
        coverUrl: data.coverUrl || '',
        isPublic: data.isPublic !== false
      }
    }
  } catch (error) {
    console.error('获取合集详情失败:', error)
    ElMessage.error('获取合集详情失败')
  }
}

// 加载合集中的稿件
const loadManuscripts = async () => {
  if (!isEditMode.value) return
  
  loading.value = true
  try {
    const response = await collectionApi.getCollectionManuscripts(collectionId.value)
    if (response.code === 200) {
      manuscripts.value = response.data?.list || []
    }
  } catch (error) {
    console.error('获取稿件列表失败:', error)
  } finally {
    loading.value = false
  }
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

  collectionForm.value.cover = file.raw
  collectionForm.value.coverUrl = URL.createObjectURL(file.raw)
  return false
}

// 保存合集
const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    let response
    if (isEditMode.value) {
      // 更新合集
      response = await collectionApi.updateCollection(collectionId.value, {
        name: collectionForm.value.name,
        description: collectionForm.value.description,
        cover: collectionForm.value.cover,
        isPublic: collectionForm.value.isPublic
      })
    } else {
      // 创建合集
      response = await collectionApi.createCollection({
        name: collectionForm.value.name,
        description: collectionForm.value.description,
        cover: collectionForm.value.cover,
        isPublic: collectionForm.value.isPublic
      })
      if (response.code === 200 && response.data?.id) {
        collectionId.value = response.data.id
      }
    }

    if (response.code === 200) {
      ElMessage.success(isEditMode.value ? '保存成功' : '创建成功')
      if (!isEditMode.value) {
        // 创建成功后跳转到编辑页面
        router.replace(`/collection/${collectionId.value}/edit`)
      }
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存合集失败:', error)
    ElMessage.error('保存合集失败')
  } finally {
    saving.value = false
  }
}

// 返回
const goBack = () => {
  if (isEditMode.value) {
    router.push(`/collection/${collectionId.value}`)
  } else {
    router.push('/collections')
  }
}

// 打开添加稿件对话框
const openAddDialog = async () => {
  if (!isEditMode.value) {
    ElMessage.warning('请先保存合集基本信息')
    return
  }
  
  addDialogVisible.value = true
  searchKeyword.value = ''
  selectedManuscripts.value = []
  await loadUserManuscripts()
}

// 加载用户的稿件
const loadUserManuscripts = async () => {
  manuscriptLoading.value = true
  try {
    const response = await manuscriptApi.getUserManuscripts(currentUserId.value, 1, 100)
    if (response.code === 200) {
      // 过滤掉已经在合集中的稿件
      const existingIds = new Set(manuscripts.value.map(m => m.id))
      userManuscripts.value = (response.data || []).filter(m => !existingIds.has(m.id))
    }
  } catch (error) {
    console.error('获取用户稿件失败:', error)
  } finally {
    manuscriptLoading.value = false
  }
}

// 搜索稿件
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    loadUserManuscripts()
    return
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  userManuscripts.value = userManuscripts.value.filter(m => 
    m.title.toLowerCase().includes(keyword)
  )
}

// 添加选中的稿件
const handleAddManuscripts = async () => {
  if (selectedManuscripts.value.length === 0) {
    ElMessage.warning('请选择要添加的稿件')
    return
  }

  try {
    const addPromises = selectedManuscripts.value.map((manuscriptId, index) => {
      return collectionApi.addManuscriptToCollection(
        collectionId.value,
        manuscriptId,
        manuscripts.value.length + index
      )
    })
    
    await Promise.all(addPromises)
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    loadManuscripts()
  } catch (error) {
    console.error('添加稿件失败:', error)
    ElMessage.error('添加稿件失败')
  }
}

// 移除稿件
const handleRemoveManuscript = async (manuscript, index) => {
  try {
    await ElMessageBox.confirm(
      `确定要从合集中移除 "${manuscript.title}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await collectionApi.removeManuscriptFromCollection(
      collectionId.value,
      manuscript.id
    )
    
    if (response.code === 200) {
      ElMessage.success('移除成功')
      manuscripts.value.splice(index, 1)
      // 重新保存排序
      await saveOrder()
    } else {
      ElMessage.error(response.message || '移除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除稿件失败:', error)
      ElMessage.error('移除稿件失败')
    }
  }
}

// 拖拽开始
const handleDragStart = (index) => {
  draggedIndex.value = index
}

// 拖拽结束
const handleDragEnd = () => {
  draggedIndex.value = null
}

// 拖拽经过
const handleDragOver = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return
  
  // 交换位置
  const draggedItem = manuscripts.value[draggedIndex.value]
  manuscripts.value.splice(draggedIndex.value, 1)
  manuscripts.value.splice(index, 0, draggedItem)
  draggedIndex.value = index
}

// 保存排序
const saveOrder = async () => {
  try {
    const manuscriptOrders = manuscripts.value.map((m, index) => ({
      manuscriptId: m.id,
      sortOrder: index
    }))
    
    await collectionApi.updateManuscriptOrder(collectionId.value, manuscriptOrders)
  } catch (error) {
    console.error('保存排序失败:', error)
  }
}

// 上移
const moveUp = async (index) => {
  if (index === 0) return
  const temp = manuscripts.value[index]
  manuscripts.value[index] = manuscripts.value[index - 1]
  manuscripts.value[index - 1] = temp
  await saveOrder()
}

// 下移
const moveDown = async (index) => {
  if (index === manuscripts.value.length - 1) return
  const temp = manuscripts.value[index]
  manuscripts.value[index] = manuscripts.value[index + 1]
  manuscripts.value[index + 1] = temp
  await saveOrder()
}

// 删除合集
const handleDeleteCollection = async () => {
  if (!isEditMode.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除合集 "${collectionForm.value.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await collectionApi.deleteCollection(collectionId.value)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      router.push('/collections')
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

onMounted(() => {
  loadCollectionDetail()
  loadManuscripts()
})
</script>

<template>
  <div class="collection-edit-page">
    <!-- 头部导航 -->
    <div class="edit-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" @click="goBack">
          返回
        </el-button>
        <h1 class="page-title">
          {{ isEditMode ? '编辑合集' : '创建合集' }}
        </h1>
      </div>
      <div class="header-right">
        <el-button v-if="isEditMode" type="danger" text @click="handleDeleteCollection">
          删除合集
        </el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </div>
    </div>

    <div class="edit-content">
      <!-- 左侧：合集信息表单 -->
      <div class="form-section">
        <el-form
          ref="formRef"
          :model="collectionForm"
          :rules="formRules"
          label-position="top"
        >
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
              <div v-if="collectionForm.coverUrl" class="cover-preview">
                <img :src="collectionForm.coverUrl" />
                <div class="cover-overlay">
                  <el-icon :size="24"><Plus /></el-icon>
                  <span>更换封面</span>
                </div>
              </div>
              <div v-else class="cover-placeholder">
                <el-icon :size="32"><Plus /></el-icon>
                <span>点击上传封面</span>
                <span class="cover-hint">支持 JPG、PNG 格式，最大 2MB</span>
              </div>
            </el-upload>
          </el-form-item>

          <!-- 合集名称 -->
          <el-form-item label="合集名称" prop="name">
            <el-input
              v-model="collectionForm.name"
              placeholder="请输入合集名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <!-- 合集描述 -->
          <el-form-item label="合集描述">
            <el-input
              v-model="collectionForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入合集描述（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <!-- 是否公开 -->
          <el-form-item>
            <el-checkbox v-model="collectionForm.isPublic">
              公开合集
            </el-checkbox>
            <span class="privacy-hint">
              {{ collectionForm.isPublic ? '所有人都可以看到此合集' : '仅自己可以看到此合集' }}
            </span>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：稿件管理 -->
      <div class="manuscripts-section">
        <div class="section-header">
          <h2 class="section-title">
            视频列表
            <span class="video-count">({{ manuscripts.length }})</span>
          </h2>
          <el-button
            v-if="isEditMode"
            type="primary"
            :icon="Plus"
            @click="openAddDialog"
          >
            添加视频
          </el-button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>

        <!-- 空状态 -->
        <div v-else-if="manuscripts.length === 0" class="empty-state">
          <el-empty description="暂无视频">
            <el-button v-if="isEditMode" type="primary" @click="openAddDialog">
              添加视频
            </el-button>
            <p v-else class="empty-hint">保存合集后可以添加视频</p>
          </el-empty>
        </div>

        <!-- 稿件列表 -->
        <div v-else class="manuscripts-list">
          <div
            v-for="(manuscript, index) in manuscripts"
            :key="manuscript.id"
            class="manuscript-item"
            draggable="true"
            @dragstart="handleDragStart(index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, index)"
          >
            <!-- 拖拽手柄 -->
            <div class="drag-handle">
              <el-icon><Rank /></el-icon>
            </div>

            <!-- 序号 -->
            <div class="item-index">{{ index + 1 }}</div>

            <!-- 封面 -->
            <div class="item-cover">
              <img
                :src="manuscript.coverUrl || getDefaultCover()"
                :alt="manuscript.title"
              />
            </div>

            <!-- 信息 -->
            <div class="item-info">
              <h3 class="item-title">{{ manuscript.title }}</h3>
              <p class="item-desc">{{ manuscript.description || '暂无描述' }}</p>
              <span class="item-date">{{ formatDate(manuscript.uploadTime) }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="item-actions">
              <el-button
                text
                :disabled="index === 0"
                @click="moveUp(index)"
              >
                上移
              </el-button>
              <el-button
                text
                :disabled="index === manuscripts.length - 1"
                @click="moveDown(index)"
              >
                下移
              </el-button>
              <el-button
                type="danger"
                text
                :icon="Delete"
                @click="handleRemoveManuscript(manuscript, index)"
              >
                移除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 拖拽提示 -->
        <div v-if="manuscripts.length > 1" class="drag-hint">
          <el-icon><Rank /></el-icon>
          <span>拖拽可调整视频顺序</span>
        </div>
      </div>
    </div>

    <!-- 添加稿件对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加视频"
      width="700px"
      destroy-on-close
    >
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频标题"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <!-- 稿件列表 -->
      <div v-if="manuscriptLoading" class="dialog-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="userManuscripts.length === 0" class="dialog-empty">
        <el-empty description="没有可添加的视频" />
      </div>

      <div v-else class="dialog-manuscripts">
        <el-checkbox-group v-model="selectedManuscripts">
          <div
            v-for="manuscript in userManuscripts"
            :key="manuscript.id"
            class="dialog-manuscript-item"
          >
            <el-checkbox :value="manuscript.id">
              <div class="checkbox-content">
                <img
                  :src="manuscript.coverUrl || getDefaultCover()"
                  :alt="manuscript.title"
                  class="checkbox-cover"
                />
                <div class="checkbox-info">
                  <span class="checkbox-title">{{ manuscript.title }}</span>
                  <span class="checkbox-date">{{ formatDate(manuscript.uploadTime) }}</span>
                </div>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedManuscripts.length === 0"
          @click="handleAddManuscripts"
        >
          添加 ({{ selectedManuscripts.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.collection-edit-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

/* 头部导航 */
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 编辑内容区 */
.edit-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
}

/* 表单区 */
.form-section {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

/* 封面上传 */
.cover-uploader {
  width: 100%;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 180px;
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

/* 隐私提示 */
.privacy-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

/* 稿件管理区 */
.manuscripts-section {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.video-count {
  font-size: 14px;
  color: #9499a0;
  font-weight: normal;
}

/* 加载状态 */
.loading-state {
  padding: 40px 0;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

.empty-hint {
  font-size: 14px;
  color: #909399;
  margin-top: 12px;
}

/* 稿件列表 */
.manuscripts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.manuscript-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: move;
  transition: all 0.3s ease;
}

.manuscript-item:hover {
  background-color: #e8f4f8;
}

.manuscript-item.dragging {
  opacity: 0.5;
}

/* 拖拽手柄 */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9499a0;
  cursor: move;
}

/* 序号 */
.item-index {
  width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #9499a0;
}

/* 封面 */
.item-cover {
  width: 120px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 信息 */
.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-date {
  font-size: 12px;
  color: #9499a0;
}

/* 操作按钮 */
.item-actions {
  display: flex;
  gap: 4px;
}

/* 拖拽提示 */
.drag-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  font-size: 13px;
}

/* 对话框样式 */
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-bar .el-input {
  flex: 1;
}

.dialog-loading {
  padding: 40px 0;
}

.dialog-empty {
  padding: 40px 0;
}

.dialog-manuscripts {
  max-height: 400px;
  overflow-y: auto;
}

.dialog-manuscript-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-manuscript-item:last-child {
  border-bottom: none;
}

.checkbox-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.checkbox-cover {
  width: 80px;
  height: 45px;
  border-radius: 4px;
  object-fit: cover;
}

.checkbox-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-title {
  font-size: 14px;
  color: #333;
}

.checkbox-date {
  font-size: 12px;
  color: #9499a0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .edit-content {
    grid-template-columns: 1fr;
  }

  .form-section {
    order: -1;
  }
}

@media (max-width: 768px) {
  .manuscript-item {
    flex-wrap: wrap;
  }

  .item-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .edit-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 576px) {
  .item-cover {
    width: 100px;
    height: 56px;
  }

  .checkbox-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .checkbox-cover {
    width: 100%;
    height: 80px;
  }
}
</style>
