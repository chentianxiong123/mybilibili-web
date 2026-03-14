<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VideoPlay, Star, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { interactionApi } from '../../../api/index.js'

const router = useRouter()

const activeFolderId = ref(null)
const favoriteFolders = ref([])
const favoriteVideos = ref([])
const loading = ref(false)
const isLoggedIn = ref(false)

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  return isLoggedIn.value
}

// 获取收藏夹列表
const fetchFavoriteFolders = async () => {
  if (!checkLoginStatus()) {
    favoriteFolders.value = []
    return
  }

  try {
    const response = await interactionApi.getFavoriteFolders()
    if (response.code === 200) {
      // 将后端返回的数据格式转换为组件需要的格式
      favoriteFolders.value = response.data.map(folder => ({
        id: folder.id,
        name: folder.name,
        count: folder.videoCount || 0
      }))

      // 默认选中第一个收藏夹
      if (favoriteFolders.value.length > 0 && !activeFolderId.value) {
        activeFolderId.value = favoriteFolders.value[0].id
      }
    } else {
      ElMessage.error(response.message || '获取收藏夹失败')
    }
  } catch (error) {
    console.error('获取收藏夹列表失败:', error)
    favoriteFolders.value = []
  }
}

// 获取收藏夹视频列表
const fetchFavoriteVideos = async (folderId) => {
  if (!folderId || !checkLoginStatus()) {
    favoriteVideos.value = []
    return
  }

  loading.value = true
  try {
    const response = await interactionApi.getFavoriteFolderVideos(folderId, 1, 5)
    if (response.code === 200) {
      // 将后端返回的视频数据转换为组件需要的格式
      favoriteVideos.value = response.data.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.coverUrl || 'https://via.placeholder.com/160x90?text=No+Cover',
        duration: video.duration || '00:00',
        uploader: video.uploader?.name || '未知UP主'
      }))
    } else {
      favoriteVideos.value = []
    }
  } catch (error) {
    console.error('获取收藏夹视频失败:', error)
    favoriteVideos.value = []
  } finally {
    loading.value = false
  }
}

// 处理收藏夹点击
const handleFolderClick = (folder) => {
  activeFolderId.value = folder.id
  fetchFavoriteVideos(folder.id)
}

// 查看全部
const handleViewAll = () => {
  router.push('/profile/favorites')
}

// 处理视频点击跳转
const handleVideoClick = (video) => {
  window.location.href = `/manuscript/${video.id}`
}

// 监听activeFolderId变化，自动加载对应视频
watch(activeFolderId, (newId) => {
  if (newId) {
    fetchFavoriteVideos(newId)
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchFavoriteFolders()
})
</script>

<template>
  <div class="favorite-dropdown">
    <div class="dropdown-content">
      <!-- 收藏夹列表 -->
      <div class="folder-list">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="empty-state">
          <el-icon class="empty-icon"><Star /></el-icon>
          <p>请先登录</p>
        </div>
        <!-- 收藏夹列表 -->
        <div
          v-else-if="favoriteFolders.length > 0"
          v-for="folder in favoriteFolders"
          :key="folder.id"
          :class="['folder-item', { active: activeFolderId === folder.id }]"
          @click="handleFolderClick(folder)"
        >
          <span class="folder-name">{{ folder.name }}</span>
          <span class="folder-count">{{ folder.count }}</span>
        </div>
        <!-- 空收藏夹提示 -->
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Star /></el-icon>
          <p>暂无收藏夹</p>
        </div>
      </div>

      <!-- 视频列表 -->
      <div class="video-list">
        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>加载中...</p>
        </div>
        <!-- 视频列表 -->
        <div
          v-else-if="favoriteVideos.length > 0"
          v-for="video in favoriteVideos"
          :key="video.id"
          class="video-item"
          @click="handleVideoClick(video)"
        >
          <div class="thumbnail-wrapper">
            <img :src="video.thumbnail" class="video-thumbnail" />
            <span class="video-duration">{{ video.duration }}</span>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-uploader">{{ video.uploader }}</div>
          </div>
        </div>
        <!-- 空视频提示 -->
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><VideoPlay /></el-icon>
          <p>{{ isLoggedIn ? '暂无收藏视频' : '请先登录' }}</p>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="dropdown-footer">
      <el-button link class="view-all-btn" @click="handleViewAll">
        查看全部
      </el-button>
      <el-button type="primary" class="play-all-btn" :disabled="favoriteVideos.length === 0">
        <el-icon><VideoPlay /></el-icon>
        播放全部
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.favorite-dropdown {
  width: 600px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
}

.dropdown-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.folder-list {
  width: 180px;
  background-color: #f5f7fa;
  overflow-y: auto;
  flex-shrink: 0;
}

.folder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.folder-item:hover {
  background-color: rgba(0, 161, 214, 0.1);
}

.folder-item.active {
  background-color: #00a1d6;
  color: #fff;
}

.folder-name {
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 12px;
  color: #9499a0;
  flex-shrink: 0;
  margin-left: 8px;
}

.folder-item.active .folder-count {
  color: #fff;
}

.video-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.video-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.video-item:hover {
  background-color: #f5f7fa;
}

.thumbnail-wrapper {
  position: relative;
  flex-shrink: 0;
}

.video-thumbnail {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
}

.video-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-title {
  font-size: 14px;
  color: #18191c;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-uploader {
  font-size: 12px;
  color: #9499a0;
}

.dropdown-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e3e5e7;
}

.view-all-btn {
  color: #00a1d6;
  font-size: 14px;
}

.play-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  background-color: #00a1d6;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.play-all-btn:hover {
  background-color: #0091c6;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9499a0;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9499a0;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 8px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 14px;
}
</style>
