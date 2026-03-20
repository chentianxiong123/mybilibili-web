<script setup>
import { ChatDotRound, ChatLineRound, Bell, Star, Setting } from '@element-plus/icons-vue'

const props = defineProps({
  activeType: {
    type: String,
    default: 'private'
  },
  unreadCounts: {
    type: Object,
    default: () => ({
      private: 0,
      reply: 0,
      at: 0,
      like: 0,
      system: 0
    })
  }
})

const emit = defineEmits(['change-type'])

const menuItems = [
  { key: 'private', label: '我的消息', icon: ChatDotRound },
  { key: 'reply', label: '回复我的', icon: ChatLineRound },
  { key: 'at', label: '@ 我的', icon: 'At' },
  { key: 'like', label: '收到的赞', icon: Star },
  { key: 'system', label: '系统通知', icon: Bell },
  { key: 'settings', label: '消息设置', icon: Setting }
]

const handleClick = (key) => {
  emit('change-type', key)
}
</script>

<template>
  <div class="message-sidebar">
    <div class="menu-list">
      <div
        v-for="item in menuItems"
        :key="item.key"
        :class="['menu-item', { active: activeType === item.key }]"
        @click="handleClick(item.key)"
      >
        <el-icon class="menu-icon" v-if="typeof item.icon === 'object'">
          <component :is="item.icon" />
        </el-icon>
        <span v-else class="menu-icon-text">@</span>
        <span class="menu-label">{{ item.label }}</span>
        <span v-if="unreadCounts[item.key] > 0" class="unread-badge">
          {{ unreadCounts[item.key] > 99 ? '99+' : unreadCounts[item.key] }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-sidebar {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #e3e5e7;
  flex-shrink: 0;
  padding: 16px 0;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item.active {
  background-color: rgba(0, 161, 214, 0.1);
  color: #00a1d6;
}

.menu-item.active .menu-label {
  color: #00a1d6;
  font-weight: 500;
}

.menu-icon {
  font-size: 18px;
  color: inherit;
}

.menu-icon-text {
  font-size: 16px;
  font-weight: 600;
  width: 18px;
  text-align: center;
}

.menu-label {
  font-size: 14px;
  color: #18191c;
  flex: 1;
}

.unread-badge {
  background-color: #fb7299;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}
</style>
