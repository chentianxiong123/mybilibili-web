<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { manuscriptApi } from '../api/manuscript.js'
import { categoryApi } from '../api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Delete, ArrowUp, ArrowDown, VideoPlay, Document, Plus, Loading, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()

// 上传表单 - 稿件级别
const uploadForm = reactive({
  title: '',
  categoryId: null,
  tags: [],
  description: '',
  coverFile: null,
  type: 'original' // original: 自制, repost: 转载
})

// 视频分P列表
const videoParts = ref([])

// 分类列表
const categories = ref([])

// 获取分类列表
const loadCategories = async () => {
  try {
    const res = await categoryApi.getCategoryList()
    if (res.code === 200 && res.data) {
      categories.value = res.data.map(category => ({
        value: category.id,
        label: category.name
      }))
    } else {
      ElMessage.warning('获取分区列表失败，使用默认分区')
      // 使用默认分区作为后备
      categories.value = [
        { value: 1, label: '动画' },
        { value: 2, label: '音乐' },
        { value: 3, label: '舞蹈' },
        { value: 4, label: '游戏' },
        { value: 5, label: '知识' },
        { value: 6, label: '资讯' },
        { value: 7, label: '美食' },
        { value: 8, label: '生活' }
      ]
    }
  } catch (error) {
    console.error('获取分区列表失败:', error)
    ElMessage.warning('获取分区列表失败，使用默认分区')
    // 使用默认分区作为后备
    categories.value = [
      { value: 1, label: '动画' },
      { value: 2, label: '音乐' },
      { value: 3, label: '舞蹈' },
      { value: 4, label: '游戏' },
      { value: 5, label: '知识' },
      { value: 6, label: '资讯' },
      { value: 7, label: '美食' },
      { value: 8, label: '生活' }
    ]
  }
}

// 表单验证规则
const uploadRules = {
  title: [
    { required: true, message: '请输入稿件标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择稿件分区', trigger: 'change' }
  ],
  coverFile: [
    { required: true, message: '请上传稿件封面', trigger: 'change' }
  ]
}

// 表单引用
const uploadFormRef = ref()

// 上传进度
const uploadProgress = ref(0)
const isUploading = ref(false)
const currentUploadingPart = ref('')

// 封面预览
const coverPreview = ref('')

// 标签输入
const tagInput = ref('')

// 视频上传相关
const videoUploadRef = ref(null)

// 处理封面上传
const handleCoverUpload = (file) => {
  const isImage = file.raw.type.startsWith('image/')
  const isLt10M = file.raw.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('封面只能是图片格式!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('封面大小不能超过 10MB!')
    return false
  }

  uploadForm.coverFile = file.raw
  // 生成封面预览
  const reader = new FileReader()
  reader.onload = (e) => {
    coverPreview.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
  return false // 阻止自动上传
}

// 处理视频上传（添加分P）
const handleVideoUpload = (file) => {
  console.log('handleVideoUpload called:', file)
  
  // 检查file.raw是否存在
  if (!file.raw) {
    console.error('file.raw is undefined or null:', file)
    ElMessage.error('视频文件读取失败，请重新选择')
    return false
  }
  
  const isVideo = file.raw.type.startsWith('video/')
  const isLt4G = file.raw.size / 1024 / 1024 / 1024 < 4

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt4G) {
    ElMessage.error('视频大小不能超过 4GB!')
    return false
  }

  // 添加新的分P
  const newPart = {
    id: Date.now(), // 临时ID
    file: file.raw,
    title: file.name.replace(/\.[^/.]+$/, ''), // 默认使用文件名（去掉扩展名）
    sortOrder: videoParts.value.length,
    size: file.raw.size,
    duration: null // 可以后续通过视频元素获取
  }
  
  console.log('Adding new video part:', newPart)

  videoParts.value.push(newPart)
  console.log('Current video parts:', videoParts.value)
  ElMessage.success(`已添加分P: ${newPart.title}`)
  return false // 阻止自动上传
}

// 删除分P
const removeVideoPart = (index) => {
  ElMessageBox.confirm(
    `确定要删除分P "${videoParts.value[index].title}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    videoParts.value.splice(index, 1)
    // 重新排序
    videoParts.value.forEach((part, idx) => {
      part.sortOrder = idx
    })
    ElMessage.success('分P已删除')
  }).catch(() => {})
}

// 上移分P
const movePartUp = (index) => {
  if (index === 0) return
  const temp = videoParts.value[index]
  videoParts.value[index] = videoParts.value[index - 1]
  videoParts.value[index - 1] = temp
  // 更新排序
  videoParts.value.forEach((part, idx) => {
    part.sortOrder = idx
  })
}

// 下移分P
const movePartDown = (index) => {
  if (index === videoParts.value.length - 1) return
  const temp = videoParts.value[index]
  videoParts.value[index] = videoParts.value[index + 1]
  videoParts.value[index + 1] = temp
  // 更新排序
  videoParts.value.forEach((part, idx) => {
    part.sortOrder = idx
  })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录后再上传稿件')
    return false
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    if (Date.now() > exp) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.warning('登录已过期，请重新登录')
      return false
    }
    return true
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    ElMessage.warning('登录状态异常，请重新登录')
    return false
  }
}

// 添加标签
const addTag = () => {
  const tag = tagInput.value.trim()
  if (!tag) return
  
  if (uploadForm.tags.length >= 20) {
    ElMessage.warning('最多只能添加20个标签')
    return
  }
  
  if (uploadForm.tags.includes(tag)) {
    ElMessage.warning('标签已存在')
    return
  }
  
  uploadForm.tags.push(tag)
  tagInput.value = ''
}

// 移除标签
const removeTag = (index) => {
  uploadForm.tags.splice(index, 1)
}

// 处理标签输入回车
const handleTagInputKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

// 提交上传
const handleSubmit = () => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return
  }

  // 检查是否有视频分P
  if (videoParts.value.length === 0) {
    ElMessage.warning('请至少添加一个视频分P')
    return
  }

  uploadFormRef.value.validate((valid) => {
    if (valid) {
      // 检查视频文件是否存在
      console.log('Submitting with video parts:', videoParts.value)
      const invalidParts = videoParts.value.filter(part => !part.file)
      if (invalidParts.length > 0) {
        console.error('Some video parts have no file:', invalidParts)
        ElMessage.error('部分视频文件缺失，请重新上传')
        return
      }
      
      // 构建稿件数据
      const manuscriptData = {
        title: uploadForm.title,
        description: uploadForm.description,
        cover: uploadForm.coverFile,
        categoryId: uploadForm.categoryId,
        tags: uploadForm.tags,
        videos: videoParts.value.map((part, index) => ({
          file: part.file,
          title: part.title,
          sortOrder: index
        }))
      }
      
      console.log('Submitting manuscript data:', manuscriptData)

      // 开始上传
      isUploading.value = true
      uploadProgress.value = 0
      currentUploadingPart.value = '正在上传稿件...'

      // 调用API上传稿件
      manuscriptApi.uploadManuscript(manuscriptData, (progress) => {
        uploadProgress.value = progress
        if (progress < 100) {
          currentUploadingPart.value = `正在上传... ${progress}%`
        } else {
          currentUploadingPart.value = '上传完成，正在处理...'
        }
      })
        .then(response => {
          if (response && response.code === 200 && response.data) {
            ElMessage.success('稿件上传成功！')
            // 上传成功后跳转到首页
            router.push('/')
          } else {
            const errorMessage = response?.message || '稿件上传失败，请检查服务器状态'
            ElMessage.error(errorMessage)
          }
        })
        .catch(error => {
          console.error('上传错误:', error)
          if (error.response) {
            const errorMessage = error.response.data?.message || '服务器错误'
            ElMessage.error(`上传失败: ${errorMessage}`)
          } else if (error.request) {
            ElMessage.error('上传失败: 无法连接到服务器')
          } else {
            ElMessage.error(`上传失败: ${error.message}`)
          }
        })
        .finally(() => {
          isUploading.value = false
          currentUploadingPart.value = ''
        })
    } else {
      return false
    }
  })
}

// 存草稿
const saveDraft = () => {
  ElMessage.info('草稿保存功能暂未实现')
}

// 返回
const cancelUpload = () => {
  if (videoParts.value.length > 0 || uploadForm.title || uploadForm.description) {
    ElMessageBox.confirm(
      '确定要取消上传吗？已填写的内容将不会保存。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.go(-1)
    }).catch(() => {})
  } else {
    router.go(-1)
  }
}

// 触发视频上传
const triggerVideoUpload = () => {
  if (videoUploadRef.value) {
    videoUploadRef.value.$el.querySelector('input').click()
  }
}

// 页面加载时获取分类列表
onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="upload-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">上传稿件</h1>
      <p class="page-subtitle">支持多P视频上传，一个稿件可包含多个视频</p>
    </div>

    <!-- 信息卡片 -->
    <div class="info-cards">
      <div class="info-card">
        <el-icon class="info-card-icon"><VideoPlay /></el-icon>
        <div class="info-card-content">
          <h3 class="info-card-title">视频大小</h3>
          <p class="info-card-desc">单个视频4G以内，时长2小时以内</p>
        </div>
      </div>
      <div class="info-card">
        <el-icon class="info-card-icon"><Document /></el-icon>
        <div class="info-card-content">
          <h3 class="info-card-title">视频格式</h3>
          <p class="info-card-desc">推荐MP4/MOV/MKV格式，转码更快</p>
        </div>
      </div>
      <div class="info-card">
        <el-icon class="info-card-icon"><UploadFilled /></el-icon>
        <div class="info-card-content">
          <h3 class="info-card-title">多P支持</h3>
          <p class="info-card-desc">一个稿件支持多个视频分P</p>
        </div>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="form-area">
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadRules"
        label-width="100px"
        class="upload-form"
      >
        <!-- 封面上传 - 稿件级别 -->
        <el-form-item label="封面" prop="coverFile">
          <div class="cover-upload-section">
            <el-upload
              class="cover-uploader"
              action="#"
              :on-change="handleCoverUpload"
              :auto-upload="false"
              accept="image/*"
              :show-file-list="false"
            >
              <div v-if="coverPreview" class="cover-preview">
                <img :src="coverPreview" alt="封面预览">
                <div class="cover-overlay">
                  <el-icon><UploadFilled /></el-icon>
                  <span>更换封面</span>
                </div>
              </div>
              <div v-else class="cover-placeholder">
                <el-icon class="placeholder-icon"><Plus /></el-icon>
                <span>点击上传封面</span>
              </div>
            </el-upload>
            <div class="cover-tip">
              <p>建议尺寸：16:9（1920×1080）</p>
              <p>最大 10MB，支持 JPG、PNG 格式</p>
              <p class="cover-tip-highlight">清晰的封面能吸引更多观众</p>
            </div>
          </div>
        </el-form-item>

        <!-- 稿件标题 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="uploadForm.title"
            placeholder="请输入稿件标题（最多100字）"
            maxlength="100"
            show-word-limit
            class="title-input"
          ></el-input>
        </el-form-item>

        <!-- 稿件类型 -->
        <el-form-item label="类型">
          <el-radio-group v-model="uploadForm.type">
            <el-radio value="original">自制</el-radio>
            <el-radio value="repost">转载</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 稿件分区 -->
        <el-form-item label="分区" prop="categoryId">
          <el-select
            v-model="uploadForm.categoryId"
            placeholder="请选择分区"
            class="category-select"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <!-- 稿件标签 -->
        <el-form-item label="标签">
          <div class="tag-section">
            <div class="tag-input-section">
              <el-input
                v-model="tagInput"
                placeholder="输入标签，按回车创建"
                @keydown="handleTagInputKeydown"
                class="tag-input"
                maxlength="20"
              >
                <template #append>
                  <el-button @click="addTag" :disabled="!tagInput || uploadForm.tags.length >= 20">添加</el-button>
                </template>
              </el-input>
              <span class="tag-count">{{ uploadForm.tags.length }}/20</span>
            </div>
            <div class="tags-container">
              <el-tag
                v-for="(tag, index) in uploadForm.tags"
                :key="index"
                closable
                @close="removeTag(index)"
                class="tag-item"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-form-item>

        <!-- 稿件简介 -->
        <el-form-item label="简介">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            placeholder="请输入稿件简介（最多2000字）"
            rows="4"
            maxlength="2000"
            show-word-limit
            class="description-input"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 视频分P上传区域 -->
    <div class="video-parts-section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><VideoPlay /></el-icon>
          视频分P
          <span class="part-count">({{ videoParts.length }}个视频)</span>
        </h3>
        <el-upload
          ref="videoUploadRef"
          class="video-upload-trigger"
          action="#"
          :on-change="handleVideoUpload"
          :auto-upload="false"
          accept="video/*"
          :show-file-list="false"
          multiple
        >
          <el-button type="primary" :icon="UploadFilled">
            添加视频
          </el-button>
        </el-upload>
      </div>

      <!-- 视频分P列表 -->
      <div v-if="videoParts.length > 0" class="video-parts-list">
        <div
          v-for="(part, index) in videoParts"
          :key="part.id"
          class="video-part-item"
        >
          <div class="part-number">P{{ index + 1 }}</div>
          <div class="part-info">
            <el-input
              v-model="part.title"
              placeholder="请输入分P标题"
              maxlength="100"
              class="part-title-input"
            ></el-input>
            <div class="part-meta">
              <span class="part-size">{{ formatFileSize(part.size) }}</span>
              <span class="part-filename">{{ part.file.name }}</span>
            </div>
          </div>
          <div class="part-actions">
            <el-button
              type="primary"
              text
              :icon="ArrowUp"
              :disabled="index === 0"
              @click="movePartUp(index)"
              title="上移"
            ></el-button>
            <el-button
              type="primary"
              text
              :icon="ArrowDown"
              :disabled="index === videoParts.length - 1"
              @click="movePartDown(index)"
              title="下移"
            ></el-button>
            <el-button
              type="danger"
              text
              :icon="Delete"
              @click="removeVideoPart(index)"
              title="删除"
            ></el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="video-empty-state">
        <el-icon class="empty-icon"><UploadFilled /></el-icon>
        <p class="empty-text">还没有添加视频</p>
        <p class="empty-subtext">点击上方"添加视频"按钮或拖拽视频文件到此处</p>
        <el-upload
          class="video-upload-area"
          action="#"
          :on-change="handleVideoUpload"
          :auto-upload="false"
          accept="video/*"
          :show-file-list="false"
          drag
          multiple
        >
          <div class="upload-drag-content">
            <el-icon class="drag-icon"><UploadFilled /></el-icon>
            <div class="drag-text">将视频文件拖到此处，或点击上传</div>
          </div>
        </el-upload>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="form-actions">
      <el-button @click="cancelUpload" :disabled="isUploading" size="large">取消</el-button>
      <el-button @click="saveDraft" :disabled="isUploading" size="large">存草稿</el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="isUploading"
        :disabled="isUploading || videoParts.length === 0"
        size="large"
      >
        {{ isUploading ? '上传中...' : '立即投稿' }}
      </el-button>
    </div>

    <!-- 上传进度对话框 -->
    <el-dialog
      v-model="isUploading"
      title="稿件上传进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      class="upload-progress-dialog"
    >
      <div class="progress-content">
        <el-progress
          :percentage="uploadProgress"
          :stroke-width="20"
          :status="uploadProgress === 100 ? 'success' : ''"
          class="upload-progress-bar"
        ></el-progress>
        <div class="upload-status">
          <el-icon v-if="uploadProgress < 100" class="status-icon loading"><Loading /></el-icon>
          <el-icon v-else class="status-icon success"><CircleCheck /></el-icon>
          <span class="status-text">{{ currentUploadingPart }}</span>
        </div>
        <div v-if="uploadProgress === 100" class="upload-hint">
          正在处理视频，请稍候...
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.upload-container {
  width: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 信息卡片 */
.info-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.info-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
}

.info-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.info-card-icon {
  font-size: 32px;
  opacity: 0.9;
}

.info-card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.info-card-desc {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

/* 表单区域 */
.form-area {
  background-color: #fff;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.upload-form {
  max-width: 800px;
}

/* 封面上传 */
.cover-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.cover-uploader {
  width: 240px;
  height: 135px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.cover-uploader:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.cover-preview {
  width: 100%;
  height: 100%;
  position: relative;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.cover-tip {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.cover-tip p {
  margin: 0;
}

.cover-tip-highlight {
  color: #409eff;
  font-weight: 500;
}

/* 输入框样式 */
.title-input,
.category-select,
.description-input {
  width: 100%;
  max-width: 600px;
}

/* 标签输入 */
.tag-section {
  width: 100%;
  max-width: 600px;
}

.tag-input-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tag-input {
  flex: 1;
}

.tag-count {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

/* 视频分P区域 */
.video-parts-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .el-icon {
  color: #409eff;
}

.part-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

/* 视频分P列表 */
.video-parts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-part-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.video-part-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.part-number {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #409eff 0%, #1677ff 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.part-info {
  flex: 1;
  min-width: 0;
}

.part-title-input {
  width: 100%;
  margin-bottom: 8px;
}

.part-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #909399;
}

.part-size {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.part-filename {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.part-actions {
  display: flex;
  gap: 4px;
}

/* 空状态 */
.video-empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.empty-subtext {
  font-size: 13px;
  color: #909399;
  margin: 0 0 24px 0;
}

.video-upload-area {
  max-width: 500px;
  margin: 0 auto;
}

.upload-drag-content {
  padding: 40px;
}

.drag-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.drag-text {
  font-size: 14px;
  color: #606266;
}

/* 底部操作按钮 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  bottom: 20px;
}

/* 上传进度对话框 */
.progress-content {
  padding: 20px;
}

.upload-progress-bar {
  margin-bottom: 20px;
}

.upload-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-icon {
  font-size: 20px;
}

.status-icon.loading {
  color: #409eff;
  animation: rotating 2s linear infinite;
}

.status-icon.success {
  color: #67c23a;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-text {
  font-size: 14px;
  color: #606266;
}

.upload-hint {
  text-align: center;
  font-size: 13px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-container {
    padding: 12px;
  }

  .info-cards {
    flex-direction: column;
  }

  .cover-upload-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .cover-uploader {
    width: 100%;
    height: 180px;
  }

  .video-part-item {
    flex-wrap: wrap;
  }

  .part-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .form-actions {
    flex-direction: column;
    position: static;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
