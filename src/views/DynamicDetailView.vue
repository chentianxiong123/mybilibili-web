<template>
  <div class="dynamic-detail-page">
    <div class="container">
      <!-- 左侧：动态内容 -->
      <div class="main-content">
        <div class="dynamic-card" v-if="dynamic">
          <!-- 动态头部 -->
          <div class="dynamic-header">
            <img
              :src="dynamic.user?.avatar || defaultAvatar"
              alt=""
              class="user-avatar"
              @click="goToUser(dynamic.userId)"
            >
            <div class="user-info">
              <div class="username" @click="goToUser(dynamic.userId)">
                {{ dynamic.user?.username || '用户' }}
              </div>
              <div class="publish-time">{{ formatTime(dynamic.createdAt) }}</div>
            </div>
          </div>

          <!-- 动态内容 -->
          <div class="dynamic-body">
            <div class="dynamic-text">{{ dynamic.content }}</div>

            <!-- 图片 -->
            <div v-if="dynamic.imageUrls && dynamic.imageUrls.length > 0" class="dynamic-images">
              <img
                v-for="(url, index) in dynamic.imageUrls"
                :key="index"
                :src="url"
                alt=""
                class="dynamic-image"
                @click="previewImage(url)"
              >
            </div>

            <!-- 引用视频 -->
            <div v-if="dynamic.refManuscriptId" class="video-card" @click="goToVideo(dynamic.refManuscriptId)">
              <div class="video-info">
                <el-icon :size="24"><VideoPlay /></el-icon>
                <span>引用了视频</span>
              </div>
              <div class="video-hint">点击跳转到视频页面</div>
            </div>
          </div>

          <!-- 动态操作 -->
          <div class="dynamic-footer">
            <span class="action-btn" :class="{ active: dynamic.isLiked }" @click="handleLike">
              <el-icon><Star /></el-icon>
              {{ dynamic.likeCount || '点赞' }}
            </span>
            <span class="action-btn active">
              <el-icon><ChatDotRound /></el-icon>
              {{ dynamic.commentCount || '评论' }}
            </span>
            <span class="action-btn" @click="handleShare">
              <el-icon><Share /></el-icon>
              {{ dynamic.shareCount || '分享' }}
            </span>
          </div>
        </div>

        <!-- 评论区 - 展开栏形式 -->
        <div class="comment-section">
          <div class="comment-collapse-header" @click="toggleCommentSection">
            <div class="comment-collapse-title">
              <el-icon><ChatDotRound /></el-icon>
              <span v-if="dynamic?.refManuscriptId && useVideoComments">
                视频评论区（与视频互通）
              </span>
              <span v-else>评论</span>
              <span class="comment-count">{{ dynamic?.commentCount || 0 }}</span>
            </div>
            <el-icon class="collapse-arrow" :class="{ 'is-expanded': isCommentExpanded }">
              <ArrowDown />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="isCommentExpanded" class="comment-collapse-content">
              <CommentSystem
                ref="commentSystemRef"
                :target-type="actualTargetType"
                :target-id="actualTargetId"
                :placeholder="commentPlaceholder"
              />
            </div>
          </el-collapse-transition>
        </div>
      </div>

      <!-- 右侧：推荐/其他 -->
      <div class="sidebar">
        <div class="user-card" v-if="dynamic?.user">
          <img
            :src="dynamic.user.avatar || defaultAvatar"
            alt=""
            class="card-avatar"
            @click="goToUser(dynamic.userId)"
          >
          <div class="card-info">
            <div class="card-username">{{ dynamic.user.username }}</div>
            <div class="card-bio">{{ dynamic.user.bio || '这个人很懒，什么都没有写~' }}</div>
          </div>
          <button class="follow-btn" v-if="!isCurrentUser" @click="handleFollow">
            {{ isFollowing ? '已关注' : '+ 关注' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound, Share, VideoPlay, ArrowDown } from '@element-plus/icons-vue'
import { dynamicApi } from '../api/dynamic.js'
import { userApi } from '../api/index.js'
import CommentSystem from '../components/CommentSystem.vue'

const route = useRoute()
const router = useRouter()

const dynamicId = computed(() => parseInt(route.params.id))
const dynamic = ref(null)
const loading = ref(false)
const isFollowing = ref(false)
const isCommentExpanded = ref(false)

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
const commentSystemRef = ref(null)

// 当前用户
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const isCurrentUser = computed(() => {
  return currentUser.value?.id === dynamic.value?.userId
})

// 是否使用视频评论区（当动态引用了视频时）
const useVideoComments = computed(() => {
  return !!dynamic.value?.refManuscriptId
})

// 实际使用的 targetType
const actualTargetType = computed(() => {
  // 如果动态引用了视频，使用 VIDEO 类型，这样评论区就与视频互通
  if (useVideoComments.value) {
    return 'VIDEO'
  }
  return 'DYNAMIC'
})

// 实际使用的 targetId
const actualTargetId = computed(() => {
  // 如果动态引用了视频，使用视频的 manuscriptId
  if (useVideoComments.value) {
    return dynamic.value.refManuscriptId
  }
  return dynamicId.value
})

// 评论输入框占位符
const commentPlaceholder = computed(() => {
  if (useVideoComments.value) {
    return '对该视频发表看法...'
  }
  return '发一条友善的评论吧~'
})

// 获取动态详情
const fetchDynamicDetail = async () => {
  loading.value = true
  try {
    const res = await dynamicApi.getDynamicById(dynamicId.value)
    if (res.code === 200) {
      dynamic.value = res.data
      // 检查关注状态
      if (currentUser.value && !isCurrentUser.value) {
        checkFollowStatus()
      }
    } else {
      ElMessage.error(res.message || '获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    ElMessage.error('获取动态详情失败')
  } finally {
    loading.value = false
  }
}

// 检查关注状态
const checkFollowStatus = async () => {
  try {
    const res = await userApi.checkFollow(dynamic.value.userId)
    if (res.code === 200) {
      isFollowing.value = res.data
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

// 点赞/取消点赞
const handleLike = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (dynamic.value.isLiked) {
      const res = await dynamicApi.unlikeDynamic(dynamicId.value)
      if (res.code === 200) {
        dynamic.value.isLiked = false
        dynamic.value.likeCount = Math.max(0, dynamic.value.likeCount - 1)
      }
    } else {
      const res = await dynamicApi.likeDynamic(dynamicId.value)
      if (res.code === 200) {
        dynamic.value.isLiked = true
        dynamic.value.likeCount = (dynamic.value.likeCount || 0) + 1
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 分享
const handleShare = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const res = await dynamicApi.shareDynamic(dynamicId.value)
    if (res.code === 200) {
      dynamic.value.shareCount = (dynamic.value.shareCount || 0) + 1
      ElMessage.success('分享成功')
    }
  } catch (error) {
    console.error('分享失败:', error)
    ElMessage.error('分享失败')
  }
}

// 关注/取消关注
const handleFollow = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const res = await userApi.follow(dynamic.value.userId, !isFollowing.value)
    if (res.code === 200) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(isFollowing.value ? '关注成功' : '取消关注成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 跳转到用户主页
const goToUser = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`)
  }
}

// 跳转到视频
const goToVideo = (manuscriptId) => {
  router.push(`/video/manuscript/${manuscriptId}`)
}

// 预览图片
const previewImage = (url) => {
  // 可以使用 Element Plus 的 Image Preview 组件
  window.open(url, '_blank')
}

// 切换评论区展开/收起
const toggleCommentSection = () => {
  isCommentExpanded.value = !isCommentExpanded.value
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchDynamicDetail()
})
</script>

<style scoped>
.dynamic-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 0 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

/* 动态卡片 */
.dynamic-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.dynamic-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

.username:hover {
  color: #00aeec;
}

.publish-time {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

/* 动态内容 */
.dynamic-body {
  margin-bottom: 16px;
}

.dynamic-text {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.dynamic-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.dynamic-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

/* 引用视频卡片 */
.video-card {
  margin-top: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.video-card:hover {
  background: #eee;
}

.video-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00aeec;
  font-size: 14px;
}

.video-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 动态操作 */
.dynamic-footer {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
}

.action-btn:hover,
.action-btn.active {
  color: #00aeec;
}

/* 评论区 - 展开栏形式 */
.comment-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.comment-collapse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.3s;
  border-bottom: 1px solid transparent;
}

.comment-collapse-header:hover {
  background: #f5f5f5;
}

.comment-collapse-header:hover .collapse-arrow {
  color: #00aeec;
}

.comment-collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.comment-collapse-title .el-icon {
  color: #00aeec;
  font-size: 18px;
}

.comment-count {
  color: #999;
  font-size: 13px;
  font-weight: normal;
}

.collapse-arrow {
  font-size: 16px;
  color: #999;
  transition: transform 0.3s, color 0.3s;
}

.collapse-arrow.is-expanded {
  transform: rotate(180deg);
}

.comment-collapse-content {
  padding: 20px;
  border-top: 1px solid #eee;
}

/* 侧边栏用户卡片 */
.user-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.card-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  cursor: pointer;
}

.card-info {
  margin-bottom: 16px;
}

.card-username {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.card-bio {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.follow-btn {
  width: 100%;
  padding: 10px;
  background: #00aeec;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.follow-btn:hover {
  background: #0099d4;
}

/* 响应式 */
@media (max-width: 900px) {
  .sidebar {
    display: none;
  }
}
</style>
