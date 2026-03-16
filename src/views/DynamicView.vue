<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, Share, Star, Picture, Link, MoreFilled, ArrowDown, VideoPlay, Clock, View } from '@element-plus/icons-vue'
import CommentSystem from '@/components/CommentSystem.vue'
import EmojiPopover from '@/components/EmojiPopover.vue'
import VideoSelectDialog from '@/components/VideoSelectDialog.vue'
import { dynamicApi } from '@/api/dynamic.js'
import { useUserStore } from '@/stores/user.js'
import { ElMessage } from 'element-plus'
import api from '@/api/index.js'
import { searchApi } from '@/api/search.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentUser = computed(() => userStore.userInfo || {})

const dynamicContent = ref('')
const selectedImages = ref([])
const imagePreviewUrls = ref([])
const showVideoRefDialog = ref(false)
const refVideoId = ref(null)
const refVideoInfo = ref(null)

// 表情选择器状态
const showEmojiPicker = ref(false)
const emojiBtnRef = ref(null)

// 视频选择弹窗状态
const showVideoSelectDialog = ref(false)

const followingUsers = ref([
  { id: null, name: '全部动态', avatar: '', isAll: true }
])
const selectedUserId = ref(null)

const dynamicList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const loading = ref(false)

const hotSearchList = ref([])

// 获取热搜榜
const fetchHotSearch = async () => {
  try {
    const response = await searchApi.getHotSearch()
    if (response.code === 200 && response.data) {
      hotSearchList.value = response.data.map(item => ({
        rank: item.rank,
        title: item.keyword,
        hot: item.rank <= 3 ? '热' : (item.rank <= 5 ? '新' : ''),
        color: item.rank <= 3 ? '#ff2442' : '#ff6699'
      }))
    }
  } catch (error) {
    console.error('获取热搜榜失败:', error)
    hotSearchList.value = []
  }
}

const handleImageSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length + selectedImages.value.length > 9) {
    ElMessage.warning('最多只能上传9张图片')
    return
  }
  
  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }
    selectedImages.value.push(file)
    imagePreviewUrls.value.push(URL.createObjectURL(file))
  })
  
  event.target.value = ''
}

const removeImage = (index) => {
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  selectedImages.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

const handlePublish = async () => {
  if (!dynamicContent.value.trim() && selectedImages.value.length === 0 && !refVideoId.value) {
    ElMessage.warning('请输入动态内容或添加图片')
    return
  }

  try {
    const formData = new FormData()
    formData.append('content', dynamicContent.value)
    
    if (refVideoId.value) {
      formData.append('refVideoId', refVideoId.value)
    }
    
    selectedImages.value.forEach((file, index) => {
      formData.append('images', file)
    })

    const res = await dynamicApi.publishDynamic(formData)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      dynamicContent.value = ''
      selectedImages.value = []
      imagePreviewUrls.value = []
      refVideoId.value = null
      refVideoInfo.value = null
      await fetchDynamics()
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败：' + error.message)
  }
}

const openVideoRefDialog = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  showVideoSelectDialog.value = true
}

const handleVideoSelect = (video) => {
  refVideoId.value = video.id
  refVideoInfo.value = {
    id: video.id,
    title: video.title,
    cover: video.coverUrl
  }
  showVideoSelectDialog.value = false
  ElMessage.success('已选择视频：' + video.title)
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const insertEmoji = (emoji) => {
  dynamicContent.value += emoji
}

const clearVideoRef = () => {
  refVideoId.value = null
  refVideoInfo.value = null
}

const fetchFollowingUsers = async () => {
  try {
    const res = await api.get('/follow/following/simple')
    if (res.code === 200 && res.data) {
      followingUsers.value = [
        { id: null, name: '全部动态', avatar: '', isAll: true },
        ...res.data.map(user => ({
          id: user.id,
          name: user.username,
          avatar: user.avatar
        }))
      ]
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
  }
}

const fetchDynamics = async () => {
  if (loading.value) return
  loading.value = true

  try {
    let res
    if (selectedUserId.value === null) {
      res = await dynamicApi.getDynamicList(currentPage.value, pageSize.value)
    } else {
      res = await dynamicApi.getFollowingDynamics(currentPage.value, pageSize.value, selectedUserId.value)
    }

    if (res.code === 200) {
      const list = res.data.list || res.data
      // 映射数据，确保 stats 对象存在
      const mappedList = (list || []).map(item => ({
        ...item,
        stats: {
          shareCount: item.shareCount || 0,
          commentCount: item.commentCount || 0,
          likeCount: item.likeCount || 0,
          isLiked: item.isLiked || false
        }
      }))
      if (currentPage.value === 1) {
        dynamicList.value = mappedList
      } else {
        dynamicList.value.push(...mappedList)
      }
      hasMore.value = list.length === pageSize.value
    }
  } catch (error) {
    console.error('获取动态失败:', error)
  } finally {
    loading.value = false
  }
}

const selectUser = (userId) => {
  selectedUserId.value = userId
  currentPage.value = 1
  dynamicList.value = []
  fetchDynamics()
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++
    fetchDynamics()
  }
}

const handleLike = async (item) => {
  try {
    // 确保 stats 对象存在
    if (!item.stats) {
      item.stats = {
        isLiked: false,
        likeCount: 0
      }
    }

    if (item.stats.isLiked) {
      // 取消点赞
      const res = await dynamicApi.unlikeDynamic(item.id)
      if (res.code === 200) {
        // 使用后端返回的真实数据，如果后端没有返回数据，则前端自行切换状态
        if (res.data) {
          item.stats.isLiked = res.data.isLiked ?? false
          item.stats.likeCount = res.data.likeCount ?? Math.max(0, item.stats.likeCount - 1)
        } else {
          // 后端没有返回具体数据，前端自行更新状态
          item.stats.isLiked = false
          item.stats.likeCount = Math.max(0, item.stats.likeCount - 1)
        }
        ElMessage.success('取消点赞成功')
      } else {
        ElMessage.error(res.message || '取消点赞失败')
      }
    } else {
      // 点赞
      const res = await dynamicApi.likeDynamic(item.id)
      if (res.code === 200) {
        // 使用后端返回的真实数据，如果后端没有返回数据，则前端自行切换状态
        if (res.data) {
          item.stats.isLiked = res.data.isLiked ?? true
          item.stats.likeCount = res.data.likeCount ?? item.stats.likeCount + 1
        } else {
          // 后端没有返回具体数据，前端自行更新状态
          item.stats.isLiked = true
          item.stats.likeCount = item.stats.likeCount + 1
        }
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error(res.message || '点赞失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleForward = async (item) => {
  try {
    const res = await dynamicApi.shareDynamic(item.id)
    if (res.code === 200) {
      item.shareCount++
      ElMessage.success('分享成功')
    }
  } catch (error) {
    ElMessage.error('分享失败')
  }
}

// 切换评论区展开/收起
const toggleComment = (item) => {
  item.showComments = !item.showComments
}

const goToUserProfile = (userId) => {
  router.push(`/profile/${userId}/home`)
}

const goToVideo = (videoId) => {
  router.push(`/video/${videoId}`)
}

const goToManuscript = (manuscriptId) => {
  router.push(`/video/${manuscriptId}`)
}

const goToSearch = (keyword) => {
  router.push(`/search?keyword=${encodeURIComponent(keyword)}`)
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 初始化用户信息
const initUserInfo = () => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  
  if (token && userData) {
    try {
      const user = JSON.parse(userData)
      userStore.setUserInfo(user)
      userStore.setLoginStatus(true)
      userStore.token = token
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
}

onMounted(() => {
  initUserInfo()
  fetchFollowingUsers()
  fetchDynamics()
  fetchHotSearch()
})
</script>

<template>
  <div class="dynamic-page">
    <div class="dynamic-container">
      <aside class="left-sidebar">
        <div class="user-card" v-if="userStore.isLoggedIn && currentUser.id">
          <div class="user-avatar-section" @click="goToUserProfile(currentUser.id)">
            <img :src="currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" alt="头像" class="user-avatar">
            <div class="user-level" v-if="currentUser.level">LV{{ currentUser.level }}</div>
          </div>
          <div class="user-name">{{ currentUser.username }}</div>
          <div class="user-stats">
            <div class="stat-item" @click="goToUserProfile(currentUser.id)">
              <div class="stat-value">{{ currentUser.followingCount || 0 }}</div>
              <div class="stat-label">关注</div>
            </div>
            <div class="stat-item" @click="goToUserProfile(currentUser.id)">
              <div class="stat-value">{{ currentUser.followerCount || 0 }}</div>
              <div class="stat-label">粉丝</div>
            </div>
            <div class="stat-item" @click="goToUserProfile(currentUser.id)">
              <div class="stat-value">{{ currentUser.dynamicCount || 0 }}</div>
              <div class="stat-label">动态</div>
            </div>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <div class="publish-box">
          <div class="publish-input-wrapper">
            <textarea
              v-model="dynamicContent"
              class="publish-input"
              placeholder="有什么想和大家分享的？"
              rows="3"
            ></textarea>
          </div>
          
          <div class="image-preview" v-if="imagePreviewUrls.length > 0">
            <div v-for="(url, index) in imagePreviewUrls" :key="index" class="preview-item">
              <img :src="url" alt="预览">
              <button class="remove-btn" @click="removeImage(index)">×</button>
            </div>
          </div>

          <div class="video-ref-preview" v-if="refVideoInfo">
            <div class="video-ref-card">
              <span>引用视频：{{ refVideoInfo.title }}</span>
              <button class="clear-btn" @click="clearVideoRef">×</button>
            </div>
          </div>

          <div class="publish-toolbar">
            <div class="toolbar-left">
              <button
                ref="emojiBtnRef"
                class="tool-btn"
                :class="{ active: showEmojiPicker }"
                title="表情"
                @click="toggleEmojiPicker"
              >
                <el-icon><ChatDotRound /></el-icon>
              </button>
              <EmojiPopover
                v-model:visible="showEmojiPicker"
                :trigger-ref="emojiBtnRef"
                @select="insertEmoji"
              />
              <label class="tool-btn" title="图片">
                <el-icon><Picture /></el-icon>
                <input type="file" accept="image/*" multiple hidden @change="handleImageSelect">
              </label>
              <button class="tool-btn" title="引用视频" @click="openVideoRefDialog">
                <el-icon><Link /></el-icon>
              </button>
            </div>
            <div class="toolbar-right">
              <span class="word-count">{{ dynamicContent.length }}/200</span>
              <button class="publish-btn" :disabled="!dynamicContent.trim() && selectedImages.length === 0 && !refVideoId" @click="handlePublish">
                发布
              </button>
            </div>
          </div>
        </div>

        <!-- 视频选择弹窗 -->
        <VideoSelectDialog
          v-model:visible="showVideoSelectDialog"
          :user-id="currentUser.id"
          @select="handleVideoSelect"
        />

        <div class="following-users-bar">
          <div
            v-for="user in followingUsers"
            :key="user.id || 'all'"
            :class="['following-user-item', { active: selectedUserId === user.id }]"
            @click="selectUser(user.id)"
          >
            <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="following-avatar">
            <div v-else class="following-avatar default-avatar">全</div>
            <span class="following-name">{{ user.name }}</span>
          </div>
        </div>

        <div class="dynamic-list">
          <div v-for="item in dynamicList" :key="item.id" class="dynamic-card">
            <div class="dynamic-header">
              <img :src="item.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" alt="" class="dynamic-avatar" @click="goToUserProfile(item.userId)">
              <div class="dynamic-user-info">
                <div class="dynamic-username" @click="goToUserProfile(item.userId)">
                  {{ item.user?.username || '用户' }}
                </div>
                <div class="dynamic-time">{{ formatTime(item.createdAt) }}</div>
              </div>
              <button class="more-btn">
                <el-icon><MoreFilled /></el-icon>
              </button>
            </div>

            <div class="dynamic-body">
              <div class="dynamic-text">{{ item.content }}</div>

              <div v-if="item.imageUrls && item.imageUrls.length > 0" class="dynamic-images">
                <img v-for="(url, index) in item.imageUrls" :key="index" :src="url" alt="" class="dynamic-image" @click="() => {}">
              </div>

              <div v-if="item.refManuscriptId" class="video-card" @click="goToManuscript(item.refManuscriptId)">
                <img v-if="item.refVideo?.cover" :src="item.refVideo.cover" alt="稿件封面" class="video-cover">
                <div v-else class="video-cover-placeholder">
                  <el-icon><VideoPlay /></el-icon>
                </div>
                <div class="video-info">
                  <div class="video-title">{{ item.refVideo?.title || '引用稿件 #' + item.refManuscriptId }}</div>
                  <div class="video-meta" v-if="item.refVideo">
                    <span v-if="item.refVideo.duration" class="video-duration">
                      <el-icon><Clock /></el-icon>
                      {{ item.refVideo.duration }}
                    </span>
                    <span v-if="item.refVideo.viewCount" class="video-views">
                      <el-icon><View /></el-icon>
                      {{ formatNumber(item.refVideo.viewCount) }}次观看
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="dynamic-footer">
              <button class="action-btn" @click="handleForward(item)">
                <el-icon><Share /></el-icon>
                <span>{{ item.shareCount || '转发' }}</span>
              </button>
              <button class="action-btn" :class="{ active: item.showComments }" @click="toggleComment(item)">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ item.commentCount || '评论' }}</span>
              </button>
              <button class="action-btn" :class="{ liked: item.stats?.isLiked }" @click="handleLike(item)">
                <el-icon><Star /></el-icon>
                <span>{{ item.stats?.likeCount > 0 ? item.stats.likeCount : '点赞' }}</span>
              </button>
            </div>

            <!-- 评论区 - 展开栏形式 -->
            <el-collapse-transition>
              <div v-show="item.showComments" class="comment-section">
                <div class="comment-section-content">
                  <CommentSystem
                    :target-type="'DYNAMIC'"
                    :target-id="item.id"
                    :placeholder="'发一条友善的评论吧~'"
                    :total-count="item.commentCount"
                    @update:totalCount="val => item.commentCount = val"
                  />
                </div>
              </div>
            </el-collapse-transition>
          </div>

          <div v-if="hasMore" class="load-more" @click="loadMore">
            <span v-if="!loading">加载更多</span>
            <span v-else>加载中...</span>
          </div>

          <div v-if="!loading && dynamicList.length === 0" class="empty-state">
            暂无动态
          </div>
        </div>
      </main>

      <aside class="right-sidebar">
        <div class="ad-banner">
          <img src="https://picsum.photos/300/150?random=ad" alt="广告">
          <div class="ad-overlay">
            <div class="ad-title">社区中心</div>
          </div>
        </div>

        <div class="hot-search-card">
          <div class="hot-search-header">
            <span class="hot-search-title">热搜</span>
          </div>
          <div class="hot-search-list">
            <div v-for="item in hotSearchList" :key="item.rank" class="hot-search-item" @click="goToSearch(item.title)">
              <span :class="['hot-rank', { 'top-three': item.rank <= 3 }]">{{ item.rank }}</span>
              <span class="hot-title">{{ item.title }}</span>
              <span v-if="item.hot" class="hot-tag" :style="{ backgroundColor: item.color }">{{ item.hot }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.dynamic-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dynamic-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.left-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.user-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-avatar-section {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e3e5e7;
}

.user-level {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b9d, #feca57);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.user-name {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #18191c;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e3e5e7;
}

.stat-item {
  cursor: pointer;
  transition: opacity 0.3s;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #18191c;
}

.stat-label {
  font-size: 12px;
  color: #9499a0;
  margin-top: 4px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.publish-box {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.publish-input {
  width: 100%;
  border: 1px solid #e3e5e7;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.3s;
  font-family: inherit;
  box-sizing: border-box;
}

.publish-input:focus {
  border-color: #00aeec;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff2442;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-ref-preview {
  margin-top: 12px;
}

.video-ref-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f6f7f8;
  border-radius: 6px;
  font-size: 13px;
}

.clear-btn {
  background: none;
  border: none;
  color: #9499a0;
  cursor: pointer;
  font-size: 16px;
}

.publish-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9499a0;
  transition: all 0.3s;
}

.tool-btn:hover {
  background: #f1f2f3;
  color: #00aeec;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.word-count {
  font-size: 12px;
  color: #9499a0;
}

.publish-btn {
  padding: 8px 24px;
  background: #00aeec;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.publish-btn:hover:not(:disabled) {
  background: #00a0d8;
}

.publish-btn:disabled {
  background: #e3e5e7;
  cursor: not-allowed;
}

.following-users-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.following-user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.following-user-item.active .following-avatar {
  border-color: #00aeec;
}

.following-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.default-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f2f3;
  color: #61666d;
  font-size: 14px;
  font-weight: 600;
}

.following-name {
  font-size: 12px;
  color: #61666d;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dynamic-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dynamic-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dynamic-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.dynamic-user-info {
  flex: 1;
}

.dynamic-username {
  font-size: 14px;
  font-weight: 500;
  color: #fb7299;
  cursor: pointer;
}

.dynamic-time {
  font-size: 12px;
  color: #9499a0;
  margin-top: 4px;
}

.more-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9499a0;
}

.dynamic-body {
  margin-bottom: 16px;
}

.dynamic-text {
  font-size: 14px;
  color: #18191c;
  line-height: 1.6;
  white-space: pre-line;
}

.dynamic-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dynamic-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.video-card {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #f6f7f8;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.video-card:hover {
  background: #e8e9ea;
}

.video-cover {
  width: 120px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.video-cover-placeholder {
  width: 120px;
  height: 75px;
  background: #e3e5e7;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9499a0;
  font-size: 24px;
  flex-shrink: 0;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.video-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #9499a0;
}

.video-duration,
.video-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dynamic-footer {
  display: flex;
  border-top: 1px solid #e3e5e7;
  padding-top: 12px;
}

.dynamic-footer .action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: none;
  background: transparent;
  color: #61666d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 6px;
}

.dynamic-footer .action-btn:hover {
  background: #f1f2f3;
  color: #00aeec;
}

.dynamic-footer .action-btn.liked {
  color: #ff2442;
}

.dynamic-footer .action-btn.active {
  color: #00aeec;
}

/* 评论区 - 展开栏形式 */
.comment-section {
  margin-top: 12px;
  border-top: 1px solid #e3e5e7;
  background: #f6f7f8;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.comment-section-content {
  padding: 16px;
  background: #fff;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: #00aeec;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9499a0;
}

.right-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.ad-banner {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.ad-banner img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.ad-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 174, 236, 0.8), rgba(0, 174, 236, 0.6));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.ad-title {
  font-size: 24px;
  font-weight: 700;
}

.ad-subtitle {
  font-size: 14px;
  margin-top: 8px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.hot-search-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.hot-search-header {
  margin-bottom: 16px;
}

.hot-search-title {
  font-size: 16px;
  font-weight: 600;
  color: #18191c;
}

.hot-search-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.hot-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #9499a0;
  background: #f1f2f3;
  border-radius: 4px;
}

.hot-rank.top-three {
  color: #fff;
  background: #ff2442;
}

.hot-title {
  flex: 1;
  font-size: 14px;
  color: #18191c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-tag {
  font-size: 10px;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 表情按钮激活状态 */
.tool-btn.active {
  color: #00aeec;
  background: #e6f7ff;
}

@media (max-width: 1200px) {
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .dynamic-container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
  }
}
</style>
