<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { messageApi } from '../../../api/message.js'

const props = defineProps({
  unreadCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh-counts'])

const likes = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const markingRead = ref(false)

const fetchLikes = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true
  
  try {
    const res = await messageApi.getLikes({ page: page.value, size: 20 })
    if (res.code === 200) {
      const data = res.data || []
      if (isLoadMore) {
        likes.value.push(...data)
      } else {
        likes.value = data
      }
      hasMore.value = data.length === 20
      
      // 获取消息后，自动标记未读消息为已读
      await markUnreadAsRead(data)
    }
  } catch (error) {
    console.error('获取点赞列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 标记未读消息为已读
const markUnreadAsRead = async (data) => {
  if (markingRead.value) return
  
  // 获取未读消息ID列表
  const unreadIds = data
    .filter(item => !item.isRead)
    .map(item => item.id)
  
  if (unreadIds.length === 0) return
  
  markingRead.value = true
  try {
    // 批量标记为已读
    await messageApi.batchMarkAsRead(unreadIds)
    
    // 更新本地状态
    data.forEach(item => {
      if (unreadIds.includes(item.id)) {
        item.isRead = true
      }
    })
    
    // 触发父组件刷新未读数
    emit('refresh-counts')
  } catch (error) {
    console.error('标记已读失败:', error)
  } finally {
    markingRead.value = false
  }
}

// 点击单个消息标记已读
const handleItemClick = async (item) => {
  if (item.isRead) return
  
  try {
    await messageApi.markAsRead(item.id)
    item.isRead = true
    emit('refresh-counts')
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const loadMore = () => {
  page.value++
  fetchLikes(true)
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchLikes()
})
</script>

<template>
  <div class="like-list">
    <div class="list-header">
      <span class="header-title">收到的赞</span>
    </div>
    
    <div class="list-content" v-if="likes.length > 0">
      <div 
        v-for="item in likes" 
        :key="item.id" 
        class="like-item"
        :class="{ unread: !item.isRead }"
        @click="handleItemClick(item)"
      >
        <div class="item-left">
          <div class="user-avatars">
            <img 
              v-for="(avatar, index) in item.userAvatars?.slice(0, 3)" 
              :key="index"
              :src="avatar || '/default-avatar.png'" 
              class="user-avatar"
              :style="{ zIndex: 3 - index }"
            />
            <div v-if="item.userCount > 3" class="more-avatars">+{{ item.userCount - 3 }}</div>
          </div>
          <div class="item-content">
            <div class="like-info">
              <span class="usernames">{{ item.usernames || item.username }}</span>
              <span class="action-text">{{ item.actionText || '赞了你的视频' }}</span>
            </div>
            <div class="video-title" v-if="item.videoTitle">《{{ item.videoTitle }}》</div>
            <div class="time">{{ formatTime(item.createTime || item.createdAt) }}</div>
          </div>
        </div>
        <div class="item-right" v-if="item.videoCover || item.commentContent">
          <img v-if="item.videoCover" :src="item.videoCover" class="video-cover" />
          <div v-else class="comment-preview">{{ item.commentContent }}</div>
        </div>
      </div>
      
      <div class="load-more" v-if="hasMore">
        <el-button 
          link 
          :loading="loading" 
          @click="loadMore"
        >
          加载更多
        </el-button>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <el-icon class="empty-icon"><Star /></el-icon>
      <p class="empty-text">暂无点赞消息</p>
      <p class="empty-subtext">当有人点赞你的内容时，会显示在这里</p>
    </div>
  </div>
</template>

<style scoped>
.like-list {
  width: 680px;
  background-color: #fff;
  border-right: 1px solid #e3e5e7;
  height: 100%;
  overflow-y: auto;
}

.list-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e3e5e7;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #18191c;
}

.list-content {
  padding: 0;
}

.like-item {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f2f3;
  transition: background-color 0.3s;
  align-items: flex-start;
  cursor: pointer;
}

.like-item:hover {
  background-color: #f5f7fa;
}

.like-item.unread {
  background-color: rgba(0, 161, 214, 0.05);
}

.item-left {
  display: flex;
  flex: 1;
  gap: 12px;
  min-width: 0;
}

.user-avatars {
  display: flex;
  align-items: center;
  position: relative;
  height: 40px;
  flex-shrink: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-left: -10px;
}

.user-avatar:first-child {
  margin-left: 0;
}

.more-avatars {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e3e5e7;
  color: #61666d;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  margin-left: -10px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.like-info {
  margin-bottom: 6px;
  line-height: 1.5;
}

.usernames {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
}

.action-text {
  font-size: 14px;
  color: #9499a0;
}

.video-title {
  font-size: 13px;
  color: #18191c;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

.time {
  font-size: 13px;
  color: #9499a0;
}

.item-right {
  margin-left: 16px;
  flex-shrink: 0;
}

.video-cover {
  width: 100px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.comment-preview {
  width: 100px;
  height: 60px;
  border-radius: 4px;
  background-color: #f5f7fa;
  padding: 8px;
  font-size: 12px;
  color: #61666d;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.load-more {
  padding: 20px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #e3e5e7;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #18191c;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #9499a0;
}
</style>
