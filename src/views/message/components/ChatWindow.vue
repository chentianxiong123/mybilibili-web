<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, ChatDotRound } from '@element-plus/icons-vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send'])

const messageText = ref('')
const messageListRef = ref(null)
const maxLength = 500

const currentUserId = computed(() => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return user.id
  } catch (e) {
    return null
  }
})

const currentUserAvatar = computed(() => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return 'https://ui-avatars.com/api/?name=Me&background=0D8ABC&color=fff'
    const user = JSON.parse(userStr)
    return user.avatar || 'https://ui-avatars.com/api/?name=Me&background=0D8ABC&color=fff'
  } catch (e) {
    return 'https://ui-avatars.com/api/?name=Me&background=0D8ABC&color=fff'
  }
})

const canSend = computed(() => {
  return messageText.value.trim().length > 0 && messageText.value.length <= maxLength
})

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSend = () => {
  if (!canSend.value) return
  emit('send', messageText.value.trim())
  messageText.value = ''
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

watch(() => props.messages, () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = 0
    }
  })
}, { deep: true })
</script>

<template>
  <div class="chat-window">
    <div class="chat-header">
      <el-avatar
        :size="36"
        :src="conversation.targetUserAvatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'"
      />
      <span class="chat-title">{{ conversation.targetUserName || '用户' }}</span>
    </div>

    <div ref="messageListRef" class="message-list" v-loading="loading">
      <div v-if="messages.length === 0" class="empty-messages">
        <el-empty description="暂无消息，开始聊天吧" />
      </div>
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message-item', { 'message-self': message.senderId === currentUserId }]"
      >
        <el-avatar
          :size="36"
          :src="message.senderId === currentUserId
            ? currentUserAvatar
            : (conversation.targetUserAvatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff')"
          class="message-avatar"
        />
        <div class="message-content">
          <div class="message-bubble">
            <span class="message-text">{{ message.content }}</span>
          </div>
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-toolbar">
        <el-button link class="toolbar-btn">
          <el-icon><Picture /></el-icon>
        </el-button>
        <el-button link class="toolbar-btn">
          <el-icon><ChatDotRound /></el-icon>
        </el-button>
      </div>
      <div class="input-wrapper">
        <el-input
          v-model="messageText"
          type="textarea"
          :rows="3"
          :maxlength="maxLength"
          placeholder="请输入消息内容"
          resize="none"
          @keydown="handleKeydown"
        />
      </div>
      <div class="input-footer">
        <span class="char-count">{{ messageText.length }}/{{ maxLength }}</span>
        <el-button
          type="primary"
          :disabled="!canSend"
          @click="handleSend"
        >
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  min-width: 0;
}

.chat-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e3e5e7;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  flex-shrink: 0;
}

.chat-title {
  font-size: 16px;
  font-weight: 500;
  color: #18191c;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column-reverse;
  gap: 16px;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-self {
  flex-direction: row-reverse;
}

.message-self .message-content {
  align-items: flex-end;
}

.message-self .message-bubble {
  background-color: #00a1d6;
  color: #fff;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 60%;
}

.message-bubble {
  background-color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
}

.message-time {
  font-size: 12px;
  color: #9499a0;
}

.chat-input-area {
  background-color: #fff;
  border-top: 1px solid #e3e5e7;
  padding: 16px 20px;
  flex-shrink: 0;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-btn {
  font-size: 20px;
  color: #9499a0;
}

.toolbar-btn:hover {
  color: #00a1d6;
}

.input-wrapper {
  margin-bottom: 8px;
}

.input-wrapper :deep(.el-textarea__inner) {
  background-color: #f5f7fa;
  border: none;
  border-radius: 8px;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #00a1d6;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: #9499a0;
}
</style>
