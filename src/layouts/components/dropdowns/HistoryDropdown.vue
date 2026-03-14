<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock } from '@element-plus/icons-vue'
import { watchHistoryApi } from '../../../api/watchHistory.js'

const router = useRouter()

const emit = defineEmits(['navigate'])

// 历史记录数据
const historyGroups = ref([])
const loading = ref(false)

// 格式化日期
const formatDate = (date) => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) {
    return '今天'
  } else if (isSameDay(date, yesterday)) {
    return '昨天'
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }
}

// 判断是否同一天
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

// 格式化时间（显示完整日期时间）
const formatTime = (date) => {
  const now = new Date()
  const isToday = isSameDay(date, now)

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  if (isToday) {
    // 今天只显示时间
    return timeStr
  } else {
    // 非今天显示月-日 时:分
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${timeStr}`
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 加载历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    const response = await watchHistoryApi.getWatchHistory(1, 10)
    if (response.code === 200) {
      const list = (response.data || []).map(item => {
        const video = item.video || {}
        const uploader = video.uploader || {}
        const watchedAt = item.watchedAt ? new Date(item.watchedAt) : new Date()

        return {
          id: item.id,
          videoId: item.videoId,
          manuscriptId: video.manuscriptId,
          title: video.title || '未知视频',
          thumbnail: video.coverUrl || '',
          duration: formatDuration(item.videoDuration),
          watchedAt: watchedAt,
          dateKey: formatDate(watchedAt),
          time: formatTime(watchedAt),
          uploader: uploader.name || '未知UP主'
        }
      })

      // 按日期分组
      const groups = {}
      list.forEach(item => {
        if (!groups[item.dateKey]) {
          groups[item.dateKey] = []
        }
        groups[item.dateKey].push(item)
      })

      // 转换为数组格式
      historyGroups.value = Object.keys(groups).map(date => ({
        date,
        videos: groups[date]
      }))
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 点击视频
const handleVideoClick = (video) => {
  const targetId = video.manuscriptId || video.videoId
  if (targetId) {
    emit('navigate')
    // 使用页面刷新跳转，确保视频播放器完全重置
    window.location.href = `/manuscript/${targetId}`
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="history-dropdown">
    <div class="dropdown-header">
      <el-icon class="header-icon"><Clock /></el-icon>
      <span class="header-title">历史</span>
    </div>
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="historyGroups.length > 0" class="history-content">
      <div v-for="group in historyGroups" :key="group.date" class="history-group">
        <div class="group-date">{{ group.date }}</div>
        <div class="group-videos">
          <div
            v-for="video in group.videos"
            :key="video.id"
            class="video-item"
            @click="handleVideoClick(video)"
          >
            <div class="thumbnail-wrapper">
              <img :src="video.thumbnail || 'https://via.placeholder.com/160x90?text=视频封面'" class="video-thumbnail" />
              <span v-if="video.duration" class="video-duration">{{ video.duration }}</span>
            </div>
            <div class="video-info">
              <div class="video-title">{{ video.title }}</div>
              <div class="video-meta">
                <span class="video-time">{{ video.time }}</span>
                <span class="video-uploader">{{ video.uploader }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无历史记录</p>
    </div>
  </div>
</template>

<style scoped>
.history-dropdown {
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e3e5e7;
}

.header-icon {
  font-size: 18px;
  color: #9499a0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #18191c;
}

.loading-state {
  padding: 20px;
}

.history-content {
  padding: 8px 0;
}

.history-group {
  margin-bottom: 8px;
}

.group-date {
  font-size: 12px;
  color: #9499a0;
  padding: 8px 16px;
}

.group-videos {
  display: flex;
  flex-direction: column;
}

.video-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.video-item:hover {
  background-color: #f5f7fa;
}

.thumbnail-wrapper {
  position: relative;
  flex-shrink: 0;
}

.video-thumbnail {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
}

.video-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-title {
  font-size: 14px;
  color: #18191c;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-time {
  font-size: 12px;
  color: #9499a0;
}

.video-uploader {
  font-size: 12px;
  color: #9499a0;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9499a0;
  font-size: 14px;
}
</style>
