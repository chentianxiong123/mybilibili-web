<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound } from '@element-plus/icons-vue'
import { messageApi } from '../../../api/message.js'

const props = defineProps({
  unreadCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh-counts'])

const atList = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const markingRead = ref(false)

const fetchAtList = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true
  
  try {
    const res = await messageApi.getAtList({ page: page.value, size: 20 })
    if (res.code === 200) {
      const data = res.data || []
      if (isLoadMore) {
        atList.value.push(...data)
      } else {
        atList.value = data
      }
      hasMore.value = data.length === 20
      
      // 获取消息后，自动标记未读消息为已读
      await markUnreadAsRead(data)
    }
  } catch (error) {
    console.error('获取@列表失败:', error)
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
  fetchAtList(true)
}

const handleReply = (item) => {
  console.log('回复:', item)
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
  fetchAtList()
})
</script>

<template>
  <div class="at-list">
    <div class="list-header">
      <span class="header-title">@ 我的</span>
    </div>
    
    <div class="list-content" v-if="atList.length > 0">
      <div 
        v-for="item in atList" 
        :key="item.id" 
        class="at-item"
        :class="{ unread: !item.isRead }"
        @click="handleItemClick(item)"
      >
        <div class="item-left">
          <img :src="item.userAvatar || '/default-avatar.png'" class="user-avatar" />
          <div class="item-content">
            <div class="user-info">
              <span class="username">{{ item.username }}</span>
              <span class="action-text">{{ item.actionText || '在评论中@了我' }}</span>
            </div>
            <div class="at-content">
              <span class="at-highlight">@{{ item.targetUsername || '我' }}</span>
              <span class="content-text">{{ item.content }}</span>
            </div>
            <div class="item-actions">
              <span class="time">{{ formatTime(item.createTime) }}</span>
              <span class="action-btn" @click="handleReply(item)">
                <el-icon><ChatDotRound /></el-icon>
                回复
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
      <span class="empty-icon-text">@</span>
      <p class="empty-text">暂无@消息</p>
      <p class="empty-subtext">当有人@你时，会显示在这里</p>
    </div>
  </div>
</template>

<style scoped>
.at-list {
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

.at-item {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f2f3;
  transition: background-color 0.3s;
  cursor: pointer;
}

.at-item:hover {
  background-color: #f5f7fa;
}

.at-item.unread {
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

.at-content {
  font-size: 14px;
  color: #18191c;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
}

.at-highlight {
  color: #00a1d6;
  font-weight: 500;
}

.content-text {
  color: #18191c;
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

.empty-icon-text {
  font-size: 64px;
  color: #e3e5e7;
  margin-bottom: 16px;
  font-weight: 600;
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
