<script setup>
import { computed } from 'vue'
import { ChatDotRound, ChatLineRound, Bell, Star, Setting } from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'private'
  }
})

const emptyConfig = {
  private: {
    icon: ChatDotRound,
    title: '选择一个会话开始聊天',
    description: '在左侧选择一个联系人开始对话'
  },
  reply: {
    icon: ChatLineRound,
    title: '暂无回复消息',
    description: '当有人回复你的评论时，会显示在这里'
  },
  at: {
    icon: 'At',
    title: '暂无@消息',
    description: '当有人@你时，会显示在这里'
  },
  like: {
    icon: Star,
    title: '暂无点赞消息',
    description: '当有人点赞你的内容时，会显示在这里'
  },
  system: {
    icon: Bell,
    title: '暂无系统通知',
    description: '系统消息会显示在这里'
  },
  settings: {
    icon: Setting,
    title: '消息设置',
    description: '管理你的消息通知偏好'
  }
}

const config = computed(() => emptyConfig[props.type] || emptyConfig.private)
</script>

<template>
  <div class="empty-state">
    <div class="empty-content">
      <el-icon class="empty-icon" v-if="typeof config.icon === 'object'">
        <component :is="config.icon" />
      </el-icon>
      <span v-else class="empty-icon-text">@</span>
      <h3 class="empty-title">{{ config.title }}</h3>
      <p class="empty-description">{{ config.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  min-width: 0;
}

.empty-content {
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 64px;
  color: #e3e5e7;
  margin-bottom: 16px;
}

.empty-icon-text {
  font-size: 64px;
  color: #e3e5e7;
  margin-bottom: 16px;
  display: block;
  font-weight: 600;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #18191c;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #9499a0;
}
</style>
