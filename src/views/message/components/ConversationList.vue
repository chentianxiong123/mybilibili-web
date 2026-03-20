<script setup>
const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeConversation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select'])

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const handleSelect = (conversation) => {
  emit('select', conversation)
}
</script>

<template>
  <div class="conversation-list">
    <div class="list-header">
      <span class="header-title">最近消息</span>
    </div>
    <div class="conversation-items">
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        :class="['conversation-item', { active: activeConversation?.id === conversation.id }]"
        @click="handleSelect(conversation)"
      >
        <div class="avatar-wrapper">
          <el-avatar
            :size="40"
            :src="conversation.targetUserAvatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'"
          />
          <span v-if="conversation.unreadCount > 0" class="unread-dot"></span>
        </div>
        <div class="conversation-info">
          <div class="info-top">
            <span class="user-name">{{ conversation.targetUserName || '用户' }}</span>
            <span class="message-time">{{ formatTime(conversation.lastMessageTime) }}</span>
          </div>
          <div class="info-bottom">
            <span class="last-message">{{ conversation.lastMessageContent || '暂无消息' }}</span>
            <span v-if="conversation.unreadCount > 0" class="unread-count">
              {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
            </span>
          </div>
        </div>
      </div>
      <div v-if="conversations.length === 0" class="empty-conversations">
        <el-empty description="暂无消息" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #e3e5e7;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.list-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e3e5e7;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f5f7fa;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.active {
  background-color: rgba(0, 161, 214, 0.1);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background-color: #fb7299;
  border-radius: 50%;
  border: 2px solid #fff;
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 12px;
  color: #9499a0;
  flex-shrink: 0;
}

.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.last-message {
  font-size: 13px;
  color: #9499a0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-count {
  background-color: #fb7299;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.empty-conversations {
  padding: 40px 0;
}
</style>
