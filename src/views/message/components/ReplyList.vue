<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Star, Delete } from '@element-plus/icons-vue'
import { messageApi } from '../../../api/message.js'

const props = defineProps({
  unreadCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh-counts'])

const replies = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const markingRead = ref(false)

const fetchReplies = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true
  
  try {
    const res = await messageApi.getReplies({ page: page.value, size: 20 })
    if (res.code === 200) {
      const data = res.data || []
      if (isLoadMore) {
        replies.value.push(...data)
      } else {
        replies.value = data
      }
      hasMore.value = data.length === 20
      
      // 获取消息后，自动标记未读消息为已读
      await markUnreadAsRead(data)
    }
  } catch (error) {
    console.error('获取回复列表失败:', error)
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
  fetchReplies(true)
}

const handleReply = (item) => {
  // 打开回复对话框
  console.log('回复:', item)
}

const handleLike = async (item) => {
  try {
    // 点赞评论
    ElMessage.success('点赞成功')
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm('确定删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // 删除通知
    replies.value = replies.value.filter(r => r.id !== item.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 取消删除
  }
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
  fetchReplies()
})
</script>

<template>
  <div class="reply-list">
    <div class="list-header">
      <span class="header-title">回复我的</span>
    </div>
    
    <div class="list-content" v-if="replies.length > 0">
      <div 
        v-for="item in replies" 
        :key="item.id" 
        class="reply-item"
        :class="{ unread: !item.isRead }"
        @click="handleItemClick(item)"
      >
        <div class="item-left">
          <img :src="item.userAvatar || '/default-avatar.png'" class="user-avatar" />
          <div class="item-content">
            <div class="user-info">
              <span class="username">{{ item.username }}</span>
              <span class="action-text">{{ item.actionText || '回复了你的评论' }}</span>
            </div>
            <div class="video-title" v-if="item.videoTitle">视频：《{{ item.videoTitle }}》</div>
            <div class="reply-text">{{ item.content }}</div>
            <div class="source-content" v-if="item.commentContent">
              <span class="source-label">你的评论：</span>
              <span class="source-text">{{ item.commentContent }}</span>
            </div>
            <div class="item-actions">
              <span class="time">{{ formatTime(item.createTime || item.createdAt) }}</span>
              <span class="action-btn" @click="handleReply(item)">
                <el-icon><ChatDotRound /></el-icon>
                回复
              </span>
              <span class="action-btn" @click="handleLike(item)">
                <el-icon><Star /></el-icon>
                点赞
              </span>
              <span class="action-btn delete" @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>
                删除该通知
              </span>
            </div>
          </div>
        </div>
        <div class="item-right" v-if="item.videoCover">
          <img :src="item.videoCover" class="video-cover" />
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
      <el-icon class="empty-icon"><ChatDotRound /></el-icon>
      <p class="empty-text">暂无回复消息</p>
      <p class="empty-subtext">当有人回复你的评论时，会显示在这里</p>
    </div>
  </div>
</template>

<style scoped>
.reply-list {
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

.reply-item {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f2f3;
  transition: background-color 0.3s;
  cursor: pointer;
}

.reply-item:hover {
  background-color: #f5f7fa;
}

.reply-item.unread {
  background-color: rgba(0, 161, 214, 0.05);
}

.item-left {
  display: flex;
  flex: 1;
  gap: 12px;
  min-width: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.user-info {
  margin-bottom: 6px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
  margin-right: 8px;
}

.action-text {
  font-size: 14px;
  color: #9499a0;
}

.video-title {
  font-size: 13px;
  color: #00a1d6;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

.reply-text {
  font-size: 14px;
  color: #18191c;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
}

.source-content {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #9499a0;
}

.source-label {
  color: #00a1d6;
}

.source-text {
  color: #61666d;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

.time {
  color: #9499a0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9499a0;
  cursor: pointer;
  transition: color 0.3s;
}

.action-btn:hover {
  color: #00a1d6;
}

.action-btn.delete:hover {
  color: #fb7299;
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
