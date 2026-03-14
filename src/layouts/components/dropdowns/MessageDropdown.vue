<script setup>
import { useRouter } from 'vue-router'
import { ChatLineRound, Bell, Star, Message } from '@element-plus/icons-vue'

const router = useRouter()

const messageMenuItems = [
  { key: 'reply', label: '回复我的', icon: ChatLineRound, route: '/message/reply' },
  { key: 'at', label: '@我的', icon: 'At', route: '/message/at' },
  { key: 'like', label: '收到的赞', icon: Star, route: '/message/like' },
  { key: 'system', label: '系统消息', icon: Bell, route: '/message/system' },
  { key: 'private', label: '我的消息', icon: Message, route: '/message/private' }
]

const handleItemClick = (item) => {
  router.push(item.route)
}
</script>

<template>
  <div class="message-dropdown">
    <div
      v-for="item in messageMenuItems"
      :key="item.key"
      class="menu-item"
      @click="handleItemClick(item)"
    >
      <el-icon class="menu-icon" v-if="typeof item.icon === 'object'">
        <component :is="item.icon" />
      </el-icon>
      <span v-else class="menu-icon-text">@</span>
      <span class="menu-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.message-dropdown {
  width: 200px;
  padding: 8px 0;
  background: #fff;
  border-radius: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-icon {
  font-size: 18px;
  color: #9499a0;
}

.menu-icon-text {
  font-size: 18px;
  font-weight: 600;
  color: #9499a0;
  width: 18px;
  text-align: center;
}

.menu-label {
  font-size: 14px;
  color: #18191c;
  flex: 1;
}
</style>
