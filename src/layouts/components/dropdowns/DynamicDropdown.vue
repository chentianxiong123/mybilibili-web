<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dynamicApi } from '@/api/dynamic.js'
import { ElMessage } from 'element-plus'

const router = useRouter()

const dynamicList = ref([])
const loading = ref(false)

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

const getThumbnail = (item) => {
  // 优先使用引用稿件的封面
  if (item.refVideo?.cover) {
    return item.refVideo.cover
  }
  // 其次使用动态图片
  if (item.imageUrls && item.imageUrls.length > 0) {
    return item.imageUrls[0]
  }
  return ''
}

const fetchDynamics = async () => {
  loading.value = true
  try {
    const res = await dynamicApi.getDynamicList(1, 10)
    if (res.code === 200) {
      const list = res.data.list || res.data || []
      dynamicList.value = list.map(item => ({
        id: item.id,
        userAvatar: item.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        userName: item.user?.username || '用户',
        content: item.content || '',
        time: formatTime(item.createdAt),
        thumbnail: getThumbnail(item),
        userId: item.userId,
        // 引用稿件信息
        refManuscriptId: item.refManuscriptId,
        refVideo: item.refVideo
      }))
    }
  } catch (error) {
    console.error('获取动态失败:', error)
  } finally {
    loading.value = false
  }
}

const handleItemClick = (item) => {
  // 如果引用了稿件，跳转到稿件页面；否则跳转到动态中心
  if (item.refManuscriptId) {
    router.push(`/manuscript/${item.refManuscriptId}`)
  } else {
    router.push('/dynamic')
  }
}

const handleViewAll = () => {
  router.push('/dynamic')
}

onMounted(() => {
  fetchDynamics()
})
</script>

<template>
  <div class="dynamic-dropdown">
    <div class="dropdown-header">
      <span class="header-title">最新动态</span>
      <span class="view-all" @click="handleViewAll">查看全部</span>
    </div>
    <div class="dynamic-list" v-loading="loading">
      <div
        v-for="item in dynamicList"
        :key="item.id"
        class="dynamic-item"
        @click="handleItemClick(item)"
      >
        <el-avatar
          :size="40"
          :src="item.userAvatar"
          class="user-avatar"
        />
        <div class="dynamic-content">
          <div class="user-name">{{ item.userName }}</div>
          <div class="content-text">{{ item.content }}</div>
          <div class="item-time">{{ item.time }}</div>
        </div>
        <img
          v-if="item.thumbnail"
          :src="item.thumbnail"
          class="item-thumbnail"
        />
      </div>
      <div v-if="dynamicList.length === 0 && !loading" class="empty-state">
        暂无动态
      </div>
    </div>
  </div>
</template>

<style scoped>
.dynamic-dropdown {
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
}

.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e3e5e7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #18191c;
}

.view-all {
  font-size: 12px;
  color: #00aeec;
  cursor: pointer;
  transition: color 0.3s;
}

.view-all:hover {
  color: #00a0d8;
}

.dynamic-list {
  padding: 8px 0;
  min-height: 100px;
}

.dynamic-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.dynamic-item:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  flex-shrink: 0;
}

.dynamic-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
}

.content-text {
  font-size: 13px;
  color: #61666d;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-time {
  font-size: 12px;
  color: #9499a0;
}

.item-thumbnail {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9499a0;
  font-size: 13px;
}
</style>
