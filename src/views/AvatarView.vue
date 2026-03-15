<script setup>
import { ref, computed, onMounted } from 'vue'
import { Upload, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/index'

// 当前用户信息
const currentUser = ref(null)

// 当前头像
const currentAvatar = ref('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')

// 选中的文件
const selectedFile = ref(null)

// 预览图片 URL
const previewUrl = ref(null)

// 上传状态
const uploading = ref(false)

// 更新按钮是否禁用
const isUpdateDisabled = computed(() => !selectedFile.value || uploading.value)

// 获取完整头像URL
const getFullAvatarUrl = (url) => {
  if (!url) return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || ''}${url}`
}

// 加载用户信息
onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      currentUser.value = JSON.parse(userData)
      if (currentUser.value?.avatar) {
        currentAvatar.value = getFullAvatarUrl(currentUser.value.avatar)
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
})

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  
  if (!file) return
  
  // 验证文件大小（2M）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 2M')
    return
  }
  
  // 验证文件格式
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG 格式的图片')
    return
  }
  
  selectedFile.value = file
  
  // 创建预览 URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 触发文件选择
const triggerFileSelect = () => {
  const input = document.querySelector('.file-input')
  if (input) {
    input.click()
  }
}

// 更新头像
const updateAvatar = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  if (!currentUser.value?.id) {
    ElMessage.error('用户未登录')
    return
  }

  uploading.value = true

  try {
    // 创建 FormData 对象
    const formData = new FormData()
    formData.append('avatar', selectedFile.value)

    // 调用后端上传头像 API
    const response = await userApi.uploadAvatar(currentUser.value.id, formData)

    if (response.code === 200) {
      // 更新当前头像
      const newAvatarUrl = getFullAvatarUrl(response.data.avatar)
      currentAvatar.value = newAvatarUrl

      // 更新 localStorage 中的用户信息
      const updatedUser = { ...currentUser.value, avatar: response.data.avatar }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      currentUser.value = updatedUser

      ElMessage.success('头像更新成功')

      // 重置选择状态
      selectedFile.value = null
      previewUrl.value = null

      // 清空文件输入
      const input = document.querySelector('.file-input')
      if (input) {
        input.value = ''
      }
    } else {
      ElMessage.error(response.message || '头像上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    ElMessage.error('头像上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="avatar-page">
    <div class="avatar-container">
      <!-- 左侧上传选项 -->
      <div class="upload-options">
        <!-- 选择本地图片 -->
        <div class="upload-card" @click="triggerFileSelect">
          <div class="upload-icon">
            <el-icon :size="48"><Picture /></el-icon>
          </div>
          <div class="upload-text">选择本地图片</div>
        </div>
        
        <!-- 隐藏的文件输入 -->
        <input 
          type="file" 
          class="file-input" 
          accept="image/jpeg,image/jpg,image/png"
          @change="handleFileChange"
        />
        
        <!-- 更新按钮 -->
        <el-button 
          type="primary" 
          class="update-btn" 
          :disabled="isUpdateDisabled"
          :loading="uploading"
          @click="updateAvatar"
        >
          更新
        </el-button>
        
        <!-- 上传说明 -->
        <div class="upload-tips">
          请选择图片上传：大小 180 * 180 像素支持 JPG、PNG 等格式，图片需小于 2M
        </div>
      </div>
      
      <!-- 右侧当前头像 -->
      <div class="current-avatar-section">
        <div class="avatar-preview">
          <img :src="previewUrl || currentAvatar" alt="当前头像" class="avatar-img">
        </div>
        <div class="avatar-label">当前头像</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-page {
  padding: 0;
  width: 100%;
  height: 100%;
}

.avatar-container {
  width: 100%;
  display: flex;
  gap: 100px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 左侧上传选项 */
.upload-options {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.upload-card {
  width: 100%;
  height: 140px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.upload-card:hover {
  background-color: #e9ecef;
  border-color: #00aeec;
}

.upload-icon {
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.file-input {
  display: none;
}

.upload-tips {
  font-size: 14px;
  color: #909399;
  text-align: center;
  line-height: 1.8;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin-top: 10px;
}

.update-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
  margin-top: 10px;
}

.update-btn:disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
  cursor: not-allowed;
}

/* 右侧当前头像 */
.current-avatar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  border-left: 1px solid #e4e7ed;
  padding-left: 60px;
  padding-top: 20px;
  min-height: 300px;
}

.avatar-preview {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-label {
  font-size: 16px;
  color: #909399;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-container {
    flex-direction: column;
    gap: 40px;
    padding: 20px;
  }
  
  .upload-options {
    flex: none;
  }
  
  .upload-card,
  .update-btn {
    width: 100%;
  }
  
  .current-avatar-section {
    border-left: none;
    padding-left: 0;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
