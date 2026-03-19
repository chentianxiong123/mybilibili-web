<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Message } from '@element-plus/icons-vue'
import MessageSidebar from './components/MessageSidebar.vue'
import ConversationList from './components/ConversationList.vue'
import ChatWindow from './components/ChatWindow.vue'
import EmptyState from './components/EmptyState.vue'
import ReplyList from './components/ReplyList.vue'
import AtList from './components/AtList.vue'
import LikeList from './components/LikeList.vue'
import SystemList from './components/SystemList.vue'
import MessageSettings from './components/MessageSettings.vue'
import { messageApi } from '../../api/message.js'
import { userApi } from '../../api/index.js'

const route = useRoute()
const router = useRouter()

const activeType = computed(() => {
  const path = route.path
  if (path.includes('/message/private')) return 'private'
  if (path.includes('/message/reply')) return 'reply'
  if (path.includes('/message/at')) return 'at'
  if (path.includes('/message/like')) return 'like'
  if (path.includes('/message/system')) return 'system'
  if (path.includes('/message/settings')) return 'settings'
  return 'private'
})

const conversations = ref([])
const activeConversation = ref(null)
const currentMessages = ref([])
const unreadCounts = ref({
  private: 0,
  reply: 0,
  at: 0,
  like: 0,
  system: 0
})
const loading = ref(false)

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

const fetchConversations = async () => {
  try {
    const res = await messageApi.getConversations()
    if (res.code === 200) {
      conversations.value = res.data || []
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  }
}

const fetchUnreadCounts = async () => {
  try {
    const res = await messageApi.getUnreadCounts()
    if (res.code === 200) {
      unreadCounts.value = res.data || {}
    }
  } catch (error) {
    console.error('获取未读数失败:', error)
  }
}

const fetchMessages = async (conversationId) => {
  if (!conversationId) return
  loading.value = true
  try {
    const res = await messageApi.getMessages(conversationId)
    if (res.code === 200) {
      currentMessages.value = res.data || []
    }
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTypeChange = (type) => {
  router.push(`/message/${type}`)
  activeConversation.value = null
  currentMessages.value = []
}

const handleConversationSelect = async (conversation) => {
  activeConversation.value = conversation
  // 只有已有会话才获取消息列表
  if (conversation.id) {
    await fetchMessages(conversation.id)
    // 标记该会话的消息为已读
    if (conversation.unreadCount > 0) {
      await markConversationAsRead(conversation.id)
    }
  } else {
    // 新会话，清空消息列表
    currentMessages.value = []
  }
}

// 标记会话消息为已读
const markConversationAsRead = async (conversationId) => {
  try {
    // 获取当前会话中未读的消息
    const unreadMessages = currentMessages.value.filter(
      msg => msg.receiverId === currentUserId.value && !msg.isRead
    )
    // 批量标记为已读
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id)
      await messageApi.batchMarkAsRead(messageIds)
      // 更新本地消息状态
      unreadMessages.forEach(msg => {
        msg.isRead = true
      })
      // 更新会话未读数
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.unreadCount = 0
      }
      // 刷新未读计数
      await fetchUnreadCounts()
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const handleSendMessage = async (content) => {
  if (!activeConversation.value) {
    console.log('没有选中的会话')
    return
  }
  console.log('发送消息到:', activeConversation.value.targetUserId)
  try {
    const res = await messageApi.sendMessage({
      receiverId: activeConversation.value.targetUserId,
      content: content,
      messageType: 1
    })
    console.log('发送消息响应:', res)
    if (res.code === 200) {
      currentMessages.value.unshift(res.data)
      // 刷新会话列表，获取新创建的会话ID
      await fetchConversations()
      // 如果是新会话，更新当前选中会话为完整的会话对象
      if (!activeConversation.value.id) {
        const newConversation = conversations.value.find(
          c => c.targetUserId === activeConversation.value.targetUserId
        )
        if (newConversation) {
          // 替换为完整的会话对象（包含id）
          activeConversation.value = newConversation
        }
      }
      ElMessage.success('发送成功')
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error('发送失败')
    console.error('发送消息失败:', error)
  }
}

// 打开与指定用户的会话
const handleOpenConversationWithUser = async (targetUserId) => {
  if (!targetUserId) return

  // 先检查是否已有会话
  const existingConversation = conversations.value.find(
    c => c.targetUserId === targetUserId
  )

  if (existingConversation) {
    // 已有会话，直接选中
    handleConversationSelect(existingConversation)
  } else {
    // 没有会话，需要先获取用户信息，然后创建临时会话
    try {
      const res = await userApi.getUserById(targetUserId)
      if (res.code === 200) {
        const user = res.data
        // 创建临时会话对象
        const newConversation = {
          id: null, // 新会话，还没有ID
          targetUserId: targetUserId,
          targetUserName: user.nickname || user.username,
          targetUserAvatar: user.avatar,
          lastMessageContent: '',
          unreadCount: 0
        }
        // 添加到会话列表并选中
        conversations.value.unshift(newConversation)
        handleConversationSelect(newConversation)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      ElMessage.error('无法开始对话')
    }
  }
}

onMounted(() => {
  fetchConversations().then(() => {
    fetchUnreadCounts()
    // 检查是否有userId参数，有则自动打开对应会话
    const targetUserId = route.query.userId
    if (targetUserId) {
      handleOpenConversationWithUser(parseInt(targetUserId))
    }
  })
})

watch(() => route.path, () => {
  fetchUnreadCounts()
})
</script>

<template>
  <div class="message-center-page">
    <div class="message-header">
      <div class="header-left">
        <el-icon class="header-icon"><Message /></el-icon>
        <span class="header-title">消息中心</span>
      </div>
      <div class="header-center">我的消息</div>
      <div class="header-right">
        <span class="helper-text">应援团助手</span>
      </div>
    </div>

    <div class="message-container">
      <MessageSidebar
        :active-type="activeType"
        :unread-counts="unreadCounts"
        @change-type="handleTypeChange"
      />

      <ConversationList
        v-if="activeType === 'private'"
        :conversations="conversations"
        :active-conversation="activeConversation"
        @select="handleConversationSelect"
      />

      <ReplyList
        v-else-if="activeType === 'reply'"
        :unread-count="unreadCounts.reply"
        @refresh-counts="fetchUnreadCounts"
      />

      <AtList
        v-else-if="activeType === 'at'"
        :unread-count="unreadCounts.at"
        @refresh-counts="fetchUnreadCounts"
      />

      <LikeList
        v-else-if="activeType === 'like'"
        :unread-count="unreadCounts.like"
        @refresh-counts="fetchUnreadCounts"
      />

      <SystemList
        v-else-if="activeType === 'system'"
        :unread-count="unreadCounts.system"
        @refresh-counts="fetchUnreadCounts"
      />

      <MessageSettings
        v-else-if="activeType === 'settings'"
      />

      <div v-else class="notification-placeholder">
        <EmptyState :type="activeType" />
      </div>

      <ChatWindow
        v-if="activeType === 'private' && activeConversation"
        :conversation="activeConversation"
        :messages="currentMessages"
        :loading="loading"
        @send="handleSendMessage"
      />

      <EmptyState v-else-if="activeType === 'private'" />
    </div>
  </div>
</template>

<style scoped>
.message-center-page {
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e3e5e7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 200px;
}

.header-icon {
  font-size: 20px;
  color: #00a1d6;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #18191c;
}

.header-center {
  font-size: 16px;
  font-weight: 500;
  color: #18191c;
  flex: 1;
  text-align: center;
}

.header-right {
  width: 200px;
  text-align: right;
}

.helper-text {
  font-size: 14px;
  color: #9499a0;
  cursor: pointer;
}

.helper-text:hover {
  color: #00a1d6;
}

.message-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.notification-placeholder {
  width: 300px;
  background-color: #fff;
  border-right: 1px solid #e3e5e7;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
