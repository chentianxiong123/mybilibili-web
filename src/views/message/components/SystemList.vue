<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Trophy } from '@element-plus/icons-vue'
import { messageApi } from '../../../api/message.js'

const props = defineProps({
  unreadCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh-counts'])

const notifications = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const markingRead = ref(false)

const fetchNotifications = async (isLoadMore = false) => {
  if (loading.value) return
  loading.value = true
  
  try {
    const res = await messageApi.getSystemNotifications({ page: page.value, size: 20 })
    if (res.code === 200) {
      const data = res.data || []
      if (isLoadMore) {
        notifications.value.push(...data)
      } else {
        notifications.value = data
      }
      hasMore.value = data.length === 20
      
      // 获取消息后，自动标记未读消息为已读
      await markUnreadAsRead(data)
    }
  } catch (error) {
    console.error('获取系统通知失败:', error)
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
  fetchNotifications(true)
}

const handleAction = (item) => {
  if (item.actionUrl) {
    window.open(item.actionUrl, '_blank')
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
  fetchNotifications()
})
</script>

<template>
  <div class="system-list">
    <div class="list-header">
      <span class="header-title">系统通知</span>
    </div>
    
    <div class="list-content" v-if="notifications.length > 0">
      <div 
        v-for="item in notifications" 
        :key="item.id" 
        class="notification-item"
        :class="{ unread: !item.isRead, 'medal-item': item.type === 'medal' }"
        @click="handleItemClick(item)"
      >
        <div class="item-icon" v-if="item.type === 'medal'">
          <el-icon><Trophy /></el-icon>
        </div>
        
        <div class="item-content">
          <div class="notification-header">
            <span class="title">{{ item.title }}</span>
            <span class="time">{{ formatTime(item.createTime) }}</span>
          </div>
          <div class="notification-body">{{ item.content }}</div>
          <div class="notification-action" v-if="item.actionText">
            <span class="action-link" @click="handleAction(item)">{{ item.actionText }}</span>
          </div>
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
      <el-icon class="empty-icon"><Bell /></el-icon>
      <p class="empty-text">暂无系统通知</p>
      <p class="empty-subtext">系统消息会显示在这里</p>
    </div>
  </div>
</template>

<style scoped>
.system-list {
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

.notification-item {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #f1f2f3;
  transition: background-color 0.3s;
  gap: 12px;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: rgba(0, 161, 214, 0.05);
}

.notification-item.medal-item {
  background-color: #f6f7f8;
  border-radius: 8px;
  margin: 12px;
  border-bottom: none;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon .el-icon {
  font-size: 20px;
  color: #fff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
}

.time {
  font-size: 13px;
  color: #9499a0;
}

.notification-body {
  font-size: 14px;
  color: #61666d;
  line-height: 1.6;
  margin-bottom: 8px;
}

.notification-action {
  margin-top: 8px;
}

.action-link {
  font-size: 14px;
  color: #00a1d6;
  cursor: pointer;
}

.action-link:hover {
  color: #00b5e5;
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
